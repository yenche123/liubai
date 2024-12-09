import type { 
  LiuDownloadAuthor,
  LiuDownloadCollection,
  LiuDownloadContent, 
  LiuDownloadDraft, 
  LiuDownloadParcel, 
  LiuDownloadParcel_A, 
  LiuDownloadParcel_B,
} from "~/types/cloud/sync-get/types";
import type { 
  CollectionInfoType, 
  ContentInfoType, 
  LiuTable,
} from "~/types/types-atom";
import type {
  CollectionLocalTable, 
  ContentLocalTable, 
  DraftLocalTable, 
  MemberLocalTable,
  UserLocalTable,
} from "~/types/types-table";
import time from "~/utils/basic/time";
import valTool from "~/utils/basic/val-tool";
import { db } from "~/utils/db";
import { CloudFiler } from "../CloudFiler";
import type { SpaceType, StorageState } from "~/types/types-basic";
import type { 
  Bulk_Content,
  Bulk_Collection,
  Bulk_Draft,
} from "./types";
import transferUtil from "~/utils/transfer-util";

let merged_content_ids: string[] = []
let merged_collection_ids: string[] = []
let merged_member_ids: string[] = []

let new_contents: ContentLocalTable[] = []
let update_contents: Bulk_Content[] = []
let new_collections: CollectionLocalTable[] = []
let update_collections: Bulk_Collection[] = []
let new_drafts: DraftLocalTable[] = []
let update_drafts: Bulk_Draft[] = []

export async function handleLiuDownloadParcels(
  list: LiuDownloadParcel[]
) {
  if(list.length < 1) return

  const parcels_1: LiuDownloadParcel_A[] = []
  const parcels_2: LiuDownloadParcel_B[] = []
  list.forEach(v => {
    const p = v.parcelType
    if(p === "content") parcels_1.push(v)
    else if(p === "draft") parcels_2.push(v)
  })

  if(parcels_1.length > 0) {
    await handleContentParcels(parcels_1)
  }

  if(parcels_2.length > 0) {
    await handleDraftParcels(parcels_2)
  }

  await operateAll()
  reset()

}

function bulkNotify(
  table: LiuTable,
  list: ContentLocalTable[] | DraftLocalTable[],
) {
  list.forEach(v => {
    const len1 = v.images?.length ?? 0
    const len2 = v.files?.length ?? 0
    if(len1 || len2) {
      CloudFiler.notify(table, v._id)
    }
  })
}

function bulkNotify2(
  table: LiuTable,
  list: Bulk_Content[] | Bulk_Draft[],
) {
  list.forEach(v => {
    const bool1 = Boolean(v.changes.images)
    const bool2 = Boolean(v.changes.files)
    if(bool1 || bool2) {
      CloudFiler.notify(table, v.key)
    }
  })
}


async function operateAll() {
  if(new_contents.length > 0) {
    await db.contents.bulkPut(new_contents)

    // notify CloudFiler
    bulkNotify("contents", new_contents)
  }

  if(update_contents.length > 0) {
    await db.contents.bulkUpdate(update_contents)
    
    // notify CloudFiler
    bulkNotify2("contents", update_contents)
  }

  if(new_collections.length > 0) {
    await db.collections.bulkPut(new_collections)
  }

  if(update_collections.length > 0) {
    await db.collections.bulkUpdate(update_collections) 
  }

  if(new_drafts.length > 0) {
    await db.drafts.bulkPut(new_drafts)
    bulkNotify("drafts", new_drafts)
  }

  if(update_drafts.length > 0) {
    await db.drafts.bulkUpdate(update_drafts) 
    bulkNotify2("drafts", update_drafts)
  }

}



function reset() {
  merged_content_ids = []
  merged_collection_ids = []
  merged_member_ids = []

  new_contents = []
  update_contents = []
  new_collections = []
  update_collections = []
  new_drafts = []
  update_drafts = []
}

async function handleContentParcels(
  list: LiuDownloadParcel_A[],
) {
  let content_ids: string[] = []
  let collection_ids: string[] = []
  let member_ids: string[] = []
  let user_ids: string[] = []

  list.forEach(v => {
    content_ids.push(v.id)
    
    const d = v.content
    if(!d) return
    if(d.isMine) {
      if(d.myEmoji?._id) collection_ids.push(d.myEmoji._id)
      if(d.myFavorite?._id) collection_ids.push(d.myFavorite._id)
    }
    else {
      user_ids.push(d.author.user_id)
      if(d.author.member_id) member_ids.push(d.author.member_id)
    }
  })
  content_ids = valTool.uniqueArray(content_ids)
  collection_ids = valTool.uniqueArray(collection_ids)
  member_ids = valTool.uniqueArray(member_ids)
  user_ids = valTool.uniqueArray(user_ids)

  const local_contents = await getLocalRows<ContentLocalTable>(
    content_ids, "contents"
  )
  const local_collections = await getLocalRows<CollectionLocalTable>(
    collection_ids, "collections"
  )
  const local_members = await getLocalRows<MemberLocalTable>(member_ids, "members")
  const local_users = await getLocalRows<UserLocalTable>(user_ids, "users")

  for(let i1=0; i1<list.length; i1++) {
    const v1 = list[i1]
    if(v1.status !== "has_data") continue
    const c1 = v1.content
    if(!c1) continue
    
    const hasMerged = merged_content_ids.includes(v1.id)
    if(hasMerged) continue
    
    const oldContent = local_contents.find(v => v._id === v1.id)
    let oldFavorite: CollectionLocalTable | undefined
    let oldEmoji: CollectionLocalTable | undefined
    let oldMember: MemberLocalTable | undefined
    let oldUser: UserLocalTable | undefined
    if(c1.myFavorite) {
      const f_id = c1.myFavorite._id
      oldFavorite = local_collections.find(v => v._id === f_id)
    }
    if(c1.myEmoji) {
      const e_id = c1.myEmoji._id
      oldEmoji = local_collections.find(v => v._id === e_id)
    }
    if(c1.author.member_id) {
      const m_id = c1.author.member_id
      oldMember = local_members.find(v => v._id === m_id)
    }
    if(c1.author.user_id) {
      const u_id = c1.author.user_id
      oldUser = local_users.find(v => v._id === u_id)
    }
    const opt: MergeContentOpt = {
      oldContent,
      oldFavorite,
      oldEmoji,
      oldMember,
      oldUser,
    }
    await mergeContent(c1, opt)
  }
  
}


async function handleDraftParcels(
  list: LiuDownloadParcel_B[],
) {
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    if(v.status !== "has_data") return
    if(!v.draft) continue

    let oldDraft = await db.drafts.get(v.id)
    if(!oldDraft) {
      console.warn("get old draft using first_id")
      oldDraft = await db.drafts.get(v.draft.first_id)
      console.log("oldDraft: ")
      console.log(oldDraft)
      console.log("v.draft: ")
      console.log(v.draft)
      console.log(" ")
    }

    await mergeDraft(v.draft, oldDraft)
  }
  
}

async function deleteDraft(id: string) {
  await db.drafts.delete(id)
}

async function mergeDraft(
  d: LiuDownloadDraft,
  od?: DraftLocalTable,
) {
  const draft_id = d._id
  const old_id = od?._id

  const newOState = d.oState
  const oldOState = od?.oState

  // 1.1 the draft has been DELETED
  if(newOState === "DELETED") {
    if(old_id) {
      await deleteDraft(old_id)
    }
    return
  }

  // 1.2 the draft has been POSTED
  if(newOState === "POSTED" && old_id) {
    if(oldOState === "POSTED" || oldOState === "DELETED") {
      await deleteDraft(old_id)
      return
    }
  }

  // 2.1 create it if no local draft
  if(!od) {
    if(newOState === "OK" || newOState === "LOCAL") {
      createDraft(d)
    }
    return
  }

  // 2.2 pass if local draft has been DELETED
  if(newOState === "OK" || newOState === "LOCAL") {
    if(oldOState === "POSTED" || oldOState === "DELETED") {
      return
    }
  }

  // 3. update draft if oldDraft exists
  const u: Bulk_Draft = {
    key: draft_id,
    changes: {},
  }
  const g = u.changes
  const edited = d.editedStamp > od.editedStamp
  
  // 4. when draft has been turned into LOCAL
  if(newOState === "LOCAL") {
    if(od.oState === "LOCAL") return
    g.oState = "LOCAL"
    const ss = od.storageState
    if(ss === "CLOUD" || ss === "WAIT_UPLOAD") {
      g.storageState = getDraftStorageState(d)
    }
    if(edited) {
      g.editedStamp = d.editedStamp
    }
    u.changes = g
    update_drafts.push(u)
    return
  }

  // 5. other situations
  if(!edited) return

  g.editedStamp = d.editedStamp
  g.first_id = d.first_id
  g.oState = d.oState
  g.storageState = getDraftStorageState(d)
  g.visScope = d.visScope

  g.title = d.title
  g.liuDesc = d.liuDesc
  g.aiReadable = d.aiReadable
  const imgRes = CloudFiler.updateImages(d.images)
  if(imgRes.updated) {
    g.images = imgRes.images
  }
  const fileRes = CloudFiler.updateFiles(d.files)
  if(fileRes.updated) {
    g.files = fileRes.files
  }

  g.whenStamp = d.whenStamp
  g.remindMe = d.remindMe
  g.tagIds = d.tagIds

  u.changes = g
  update_drafts.push(u)
}

function getDraftStorageState(
  d: LiuDownloadDraft,
) {
  let storageState: StorageState = "CLOUD"
  const newOState = d.oState
  if(newOState === "LOCAL") {
    if(d.threadEdited || d.commentEdited) {
      storageState = "ONLY_LOCAL"
    }
    else {
      storageState = "LOCAL"
    }
  }
  return storageState
}

function createDraft(
  d: LiuDownloadDraft,
) {
  const b = time.getBasicStampWhileAdding()

  const { images } = CloudFiler.updateImages(d.images)
  const { files } = CloudFiler.updateFiles(d.files)

  let storageState = getDraftStorageState(d)
  const c: DraftLocalTable = {
    _id: d._id,
    ...b,
    first_id: d.first_id,
    infoType: d.infoType,
    oState: d.oState,
    user: d.user,
    spaceId: d.spaceId,
    spaceType: d.spaceType,
    threadEdited: d.threadEdited,
    commentEdited: d.commentEdited,
    parentThread: d.parentThread,
    parentComment: d.parentComment,
    replyToComment: d.replyToComment,
    visScope: d.visScope,
    storageState,

    title: d.title,
    liuDesc: d.liuDesc,
    images,
    files,

    whenStamp: d.whenStamp,
    remindMe: d.remindMe,
    tagIds: d.tagIds,
    editedStamp: d.editedStamp,
    firstSyncStamp: b.insertedStamp,
    aiReadable: d.aiReadable,
  }
  new_drafts.push(c)
}



type LocalTable = ContentLocalTable | CollectionLocalTable | UserLocalTable
  | MemberLocalTable

async function getLocalRows<T extends LocalTable>(
  ids: string[],
  table: LiuTable,
) {
  if(ids.length < 1) return []
  const col = db[table].where("_id").anyOf(ids)
  const contents = await col.toArray()
  return contents as T[]
}


interface MergeContentOpt {
  oldContent?: ContentLocalTable
  oldFavorite?: CollectionLocalTable
  oldEmoji?: CollectionLocalTable
  oldMember?: MemberLocalTable
  oldUser?: UserLocalTable
}

async function mergeContent(
  d: LiuDownloadContent,
  opt: MergeContentOpt,
) {
  const content_id = d._id
  const { author, spaceId, spaceType, infoType, myEmoji, myFavorite } = d
  
  if(!d.isMine) {
    // 1. it's not data I've ever posted, go get to merge member & user
    await mergeMember(author, opt.oldMember)
  }
  else {
    // 2. it's mine! Go to merge emoji & favorite
    const mcOpt: MergeCollectionOpt = {
      collectionType: "FAVORITE",
      contentType: infoType,
      spaceId,
      spaceType,
      content_id,
      oldCollection: opt.oldFavorite,
    }

    if(myFavorite) {
      mergeCollection(myFavorite, mcOpt)
    }
    if(myEmoji) {
      mcOpt.collectionType = "EXPRESS"
      mcOpt.oldCollection = opt.oldEmoji
      mergeCollection(myEmoji, mcOpt)
    }
  }

  // 3. create content if oldContent is undefined
  const { oldContent: oc } = opt
  if(!oc) {
    createContent(d)
    return
  }

  
  // 4. update content if oldContent exists
  const u: Bulk_Content = {
    key: content_id,
    changes: {},
  }
  const g = u.changes
  const edited = d.editedStamp > oc.editedStamp
  const nCfg = d.config ?? {}
  const oCfg = oc.config ?? {}

  // 5. when content has been turned into ONLY_LOCAL
  if(d.storageState === "ONLY_LOCAL") {
    if(oc.storageState === "ONLY_LOCAL") return
    g.storageState = "ONLY_LOCAL"
    if(edited) {
      g.editedStamp = d.editedStamp
    }
    u.changes = g
    update_contents.push(u)
    return
  }

  // 6. other situations
  if(edited) {
    g.editedStamp = d.editedStamp

    g.visScope = d.visScope
    g.title = d.title
    g.liuDesc = d.liuDesc 
    g.aiCharacter = d.aiCharacter
    g.aiReadable = d.aiReadable
    g.stateId = d.stateId
    g.stateStamp = d.stateStamp

    const imgRes = CloudFiler.updateImages(d.images, oc.images)
    if(imgRes.updated) {
      g.images = imgRes.images
    }
    const fileRes = CloudFiler.updateFiles(d.files, oc.files)
    if(fileRes.updated) {
      g.files = fileRes.files
    }

    g.search_title = d.search_title
    g.search_other = d.search_other


    if(!d.search_title && d.title) {
      g.search_title = d.title.toLowerCase()
    }
    if(!d.search_other) {
      g.search_other = transferUtil.packSearchOther(d.liuDesc, fileRes.files)
    }

  }

  const gCfg = oCfg

  // 1. showCountdown
  const n1 = nCfg.lastToggleCountdown ?? 1
  const o1 = oCfg.lastToggleCountdown ?? 1
  if(n1 > o1) {
    gCfg.lastToggleCountdown = n1
    gCfg.showCountdown = nCfg.showCountdown
    g.config = gCfg
  }

  // 2. oState
  const n2 = nCfg.lastOStateStamp ?? 1
  const o2 = oCfg.lastOStateStamp ?? 1
  if(n2 > o2 || edited) {
    gCfg.lastOStateStamp = n2
    g.removedStamp = d.removedStamp
    g.oState = d.oState
    g.config = gCfg
  }

  // 3. stateId
  const n3 = nCfg.lastOperateStateId ?? 1
  const o3 = oCfg.lastOperateStateId ?? 1
  if(n3 > o3) {
    gCfg.lastOperateStateId = n3
    g.stateId = d.stateId
    g.stateStamp = d.stateStamp
    g.config = gCfg
  }

  // 4. pin
  const n4 = nCfg.lastOperatePin ?? 1
  const o4 = oCfg.lastOperatePin ?? 1
  if(n4 > o4) {
    gCfg.lastOperatePin = n4
    g.pinStamp = d.pinStamp
    g.config = gCfg
  }

  // 5. tag
  const n5 = nCfg.lastOperateTag ?? 1
  const o5 = oCfg.lastOperateTag ?? 1
  if(n5 > o5 || edited) {
    gCfg.lastOperateTag = n5
    g.tagIds = d.tagIds
    g.tagSearched = d.tagSearched
    g.config = gCfg
  }

  // 6. remind
  const n6 = nCfg.lastOperateWhenRemind ?? 1
  const o6 = oCfg.lastOperateWhenRemind ?? 1
  if(n6 > o6 || edited) {
    gCfg.lastOperateWhenRemind = n6
    g.whenStamp = d.whenStamp
    g.calendarStamp = d.calendarStamp
    g.remindStamp = d.remindStamp
    g.remindMe = d.remindMe
    g.config = gCfg
  }

  // 7. emoji
  const n7 = nCfg.lastUpdateEmojiData ?? 1
  const o7 = oCfg.lastUpdateEmojiData ?? 1
  if(n7 > o7) {
    gCfg.lastUpdateEmojiData = n7
    g.emojiData = d.emojiData
    g.config = gCfg
  }

  // 8. levelOne levelOneAndTwo
  const n8 = nCfg.lastUpdateLevelNum ?? 1
  const o8 = oCfg.lastUpdateLevelNum ?? 1
  if(n8 > o8) {
    gCfg.lastUpdateLevelNum = n8
    g.levelOne = d.levelOne
    g.levelOneAndTwo = d.levelOneAndTwo
    g.config = gCfg
  }

  const keys = Object.keys(g)
  if(keys.length) {

    console.warn("figure out new update!")
    console.log("ID: ", content_id)
    console.log(g)
    console.log(" ")

    u.changes = g
    update_contents.push(u)
  }

}


function createContent(
  d: LiuDownloadContent,
) {
  if(d.storageState === "ONLY_LOCAL") return
  const b = time.getBasicStampWhileAdding()

  const { images } = CloudFiler.updateImages(d.images)
  const { files } = CloudFiler.updateFiles(d.files)

  const c: ContentLocalTable = {
    _id: d._id,
    ...b,
    first_id: d.first_id,
    user: d.author.user_id,
    member: d.author.member_id,
    spaceId: d.spaceId,
    spaceType: d.spaceType,

    infoType: d.infoType,
    oState: d.oState,
    visScope: d.visScope,
    storageState: d.storageState,

    title: d.title,
    liuDesc: d.liuDesc,
    images,
    files,

    calendarStamp: d.calendarStamp,
    remindStamp: d.remindStamp,
    whenStamp: d.whenStamp,
    remindMe: d.remindMe,
    emojiData: d.emojiData,
    parentThread: d.parentThread,
    parentComment: d.parentComment,
    replyToComment: d.replyToComment,
    pinStamp: d.pinStamp,

    createdStamp: d.createdStamp,
    editedStamp: d.editedStamp,
    removedStamp: d.removedStamp,

    tagIds: d.tagIds,
    tagSearched: d.tagSearched,
    stateId: d.stateId,
    stateStamp: d.stateStamp,
    config: d.config,
    search_title: d.search_title,
    search_other: d.search_other,
    
    levelOne: d.levelOne,
    levelOneAndTwo: d.levelOneAndTwo,

    firstSyncStamp: b.insertedStamp,
    aiCharacter: d.aiCharacter,
    aiReadable: d.aiReadable,
  }

  if(!c.search_title && c.title) {
    c.search_title = c.title.toLowerCase()
  }
  if(!c.search_other) {
    c.search_other = transferUtil.packSearchOther(c.liuDesc, files)
  }
  
  new_contents.push(c)
}


interface MergeCollectionOpt {
  collectionType: CollectionInfoType
  contentType: ContentInfoType
  spaceId: string
  spaceType: SpaceType
  content_id: string
  oldCollection?: CollectionLocalTable
}

function mergeCollection(
  d: LiuDownloadCollection,
  opt: MergeCollectionOpt,
) {
  const collection_id = d._id
  if(!collection_id) return
  const handled = merged_collection_ids.includes(collection_id)
  if(handled) return
  merged_collection_ids.push(collection_id)

  const { 
    collectionType,
    contentType,
    spaceId,
    spaceType,
    content_id,
    oldCollection,
  } = opt
  const now = time.getTime()

  // 1. create collection if no oldCollection
  if(!oldCollection) {
    const b1 = time.getBasicStampWhileAdding()
    const u1: CollectionLocalTable = {
      _id: collection_id,
      ...b1,
      first_id: d.first_id,
      oState: d.oState,
      user: d.user,
      member: d.member,
      infoType: collectionType,
      forType: contentType,
      spaceId,
      spaceType,
      content_id,
      emoji: d.emoji,
      firstSyncStamp: now,
      operateStamp: d.operateStamp,
      sortStamp: d.sortStamp,
    }
    new_collections.push(u1)
    return
  }

  // 2. compare operateStamp
  const oldStamp = oldCollection.operateStamp ?? 2
  const newStamp = d.operateStamp ?? 1
  if(newStamp <= oldStamp) return

  // 3. update collection
  const u3: Partial<CollectionLocalTable> = {
    oState: d.oState,
    emoji: d.emoji,
    infoType: collectionType,
    operateStamp: now,
    updatedStamp: now,
  }
  
  // 4. construct Bulk_Collection
  const obj4: Bulk_Collection = {
    key: collection_id,
    changes: u3,
  }
  update_collections.push(obj4)
}

async function mergeMember(
  d: LiuDownloadAuthor,
  oldMember?: MemberLocalTable,
) {
  const userId = d.user_id
  const m_id = d.member_id
  const m_oState = d.member_oState
  if(!m_id || !m_oState) return
  const handled = merged_member_ids.includes(m_id)
  if(handled) return
  merged_member_ids.push(m_id)

  const m_name = d.member_name
  const m_avatar = d.member_avatar
  
  // 1. create member if no oldMember
  if(!oldMember) {
    const b1 = time.getBasicStampWhileAdding()
    const { image: avatar, useCloud } = CloudFiler.imageFromCloudToStore(m_avatar)
    const u1: MemberLocalTable = {
      _id: m_id,
      ...b1,
      user: userId,
      spaceId: d.space_id,
      name: m_name,
      avatar,
      oState: m_oState,
    }
    await db.members.put(u1)
    if(useCloud) CloudFiler.notify("members", m_id)
    return
  }
  
  // 2. update member
  let updated = false
  const now = time.getTime()
  const u2: Partial<MemberLocalTable> = {
    updatedStamp: now,
  }

  // 2.1 check out oState
  if(oldMember.oState !== m_oState) {
    u2.oState = m_oState
    updated = true
  }

  // 2.2 check out name
  if(oldMember.name !== m_name) {
    u2.name = m_name
    updated = true
  }

  // 2.3 check out avatar
  const avatarRes = CloudFiler.imageFromCloudToStore(m_avatar, oldMember.avatar)
  if(avatarRes.useCloud) {
    u2.avatar = avatarRes.image
    updated = true
  }

  // 2.4 get to update
  if(updated) {
    await db.members.update(m_id, u2)
  }

  if(avatarRes.useCloud) {
    CloudFiler.notify("members", m_id)
  }
}



