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
import type { SpaceType } from "~/types/types-basic";


let merged_content_ids: string[] = []
let merged_collection_ids: string[] = []
let merged_member_ids: string[] = []
let merged_user_ids: string[] = []

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

  reset()
  
}

function reset() {
  merged_content_ids = []
  merged_collection_ids = []
  merged_member_ids = []
  merged_user_ids = []
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

  const local_contents = await getLocalRows<ContentLocalTable>(content_ids, "contents")
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

    const oldDraft = await db.drafts.get(v.id)
    await mergeDraft(v.draft, oldDraft)
  }
  
}

async function mergeDraft(
  d: LiuDownloadDraft,
  oldDraft?: DraftLocalTable,
) {

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
    // 1. it's not data I've ever posted,  go get to merge member & user
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
      await mergeCollection(myFavorite, mcOpt)
    }
    if(myEmoji) {
      mcOpt.collectionType = "EXPRESS"
      mcOpt.oldCollection = opt.oldEmoji
      await mergeCollection(myEmoji, mcOpt)
    }

  }

}

interface MergeCollectionOpt {
  collectionType: CollectionInfoType
  contentType: ContentInfoType
  spaceId: string
  spaceType: SpaceType
  content_id: string
  oldCollection?: CollectionLocalTable
}

async function mergeCollection(
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
      operateStamp: d.operateStamp,
      firstSyncStamp: now,
    }
    await db.collections.put(u1)
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
  await db.collections.update(collection_id, u3)
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



