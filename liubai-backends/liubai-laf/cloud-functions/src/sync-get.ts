// Function Name: sync-get

import { 
  verifyToken,
  checker,
  getAESKey,
  getDecryptedBody,
  getEncryptedData,
  valTool,
  decryptCloudData,
} from "@/common-util"
import {
  Sch_Id,
  Sch_SyncGetAtom,
} from "@/common-types"
import type {
  SyncGetAtom,
  SyncGetCtx,
  LiuRqReturn,
  SyncGetAtomRes,
  SyncGet_ThreadList,
  Table_User,
  Table_Content,
  SyncGetTable,
  Table_Collection,
  LiuDownloadAuthor,
  Table_Member,
  SyncGetCtxKey,
  TableName,
  LiuDownloadCollection,
  LiuDownloadContent,
  CollectionInfoType,
  LiuContent,
  Cloud_ImageStore,
  Cloud_FileStore,
  LiuErrReturn,
  LiuDownloadParcel_A,
  Res_SyncGet_Cloud,
  SyncGet_CheckContents,
} from "@/common-types"
import cloud from '@lafjs/cloud'
import * as vbot from "valibot"

const db = cloud.database()
const _ = db.command

export async function main(ctx: FunctionContext) {
  // 1. pre-check
  const res1 = preCheck()
  if(res1) return res1
  
  // 2. verify token
  const body = ctx.request?.body ?? {}
  const vRes = await verifyToken(ctx, body)
  if(!vRes.pass) return vRes.rqReturn
  const user = vRes.userData
  const workspaces = vRes.workspaces ?? []

  // 3. decrypt body
  const res3 = getDecryptedBody(body, vRes)
  if(!res3.newBody || res3.rqReturn) {
    return res3.rqReturn ?? { code: "E5001" }
  }

  // 4. check body
  const res4 = checkBody(res3.newBody)
  if(res4) return res4

  // 5. init sgCtx
  const sgCtx = initSgCtx(user, workspaces)

  // 6. to execute
  const results = await toExecute(sgCtx, res3.newBody)
  
  // 7. construct response
  const res7: Res_SyncGet_Cloud = {
    results,
    plz_enc_results: results,
  }
  const encRes = getEncryptedData(res7, vRes)
  if(!encRes.data || encRes.rqReturn) {
    return encRes.rqReturn ?? { code: "E5001", errMsg: "getEncryptedData failed" }
  }

  return { code: "0000", data: encRes.data }
}


interface OperationOpt {
  taskId: string
}

async function toExecute(
  sgCtx: SyncGetCtx,
  body: Record<string, any>,
) {
  const results: SyncGetAtomRes[] = []
  const list = body.atoms as SyncGetAtom[]

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { taskType, taskId } = v
    const opt: OperationOpt = { taskId }

    let res1: SyncGetAtomRes | undefined
    if(taskType === "thread_list") {
      res1 = await toThreadList(sgCtx, v, opt)
    }
    else if(taskType === "check_contents") {
      toCheckContents(sgCtx, v, opt)
    }

    if(!res1) {
      res1 = { code: "E5001", taskId, errMsg: "the taskType cannot match"  }
    }

    results.push(res1)
  }

  return results
}


async function toCheckContents(
  sgCtx: SyncGetCtx,
  atom: SyncGet_CheckContents,
  opt: OperationOpt,
) {
  const { taskId } = opt

  // 1. checking out input
  const ids = atom.ids
  const Sch_Ids = vbot.array(Sch_Id, [
    vbot.minLength(1),
    vbot.maxLength(32),
  ])
  const res1 = vbot.safeParse(Sch_Ids, ids)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg, taskId }
  }

  // 2. get contents
  const contents = await getListViaIds<Table_Content>(sgCtx, ids, "Content", "contents")

  // 3. construct list
  const list = ids.map(v => {
    const d3 = contents.find(v2 => v2._id === v)
    const obj3: LiuDownloadParcel_A = {
      id: v,
      status: d3 ? "has_data" : "not_found",
      parcelType: "content",
    }
    return obj3
  })

  // 4. checking auth
  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const content_id = v._id
    const res4 = getSharedData_1(sgCtx, v.spaceId, opt)
    if(!res4.pass) {
      list.forEach(v2 => {
        if(v2.id === content_id) v2.status = "no_auth"
      })
      contents.splice(i, 1)
      i--
    }
  }

  // 5. if nothing
  if(contents.length < 1) {
    return { code: "0000", taskId, list }
  }

  

  


  
}


async function toThreadList(
  sgCtx: SyncGetCtx,
  atom: SyncGet_ThreadList,
  opt: OperationOpt,
): Promise<SyncGetAtomRes> {
  const vT = atom.viewType

  let res1: SyncGetAtomRes | undefined
  if(vT === "FAVORITE") {
    res1 = await toThreadListFromCollection(sgCtx, atom, opt)
  }
  else {
    res1 = await toThreadListFromContent(sgCtx, atom, opt)
  }
  return res1
}


/** load threads from Content table */
async function toThreadListFromContent(
  sgCtx: SyncGetCtx,
  atom: SyncGet_ThreadList,
  opt: OperationOpt,
): Promise<SyncGetAtomRes> {
  const { taskId } = opt
  const { 
    spaceId, 
    viewType: vT, 
    limit = 16, 
    sort = "desc", 
    lastItemStamp,
    specific_ids,
    excluded_ids,
    tagId,
    stateId,
  } = atom

  // 0. checking out more
  if(vT === "STATE" && !stateId) {
    return { code: "E4000", errMsg: "stateId is required", taskId }
  }
  if(vT === "TAG" && !tagId) {
    return { code: "E4000", errMsg: "tagId is required", taskId }
  }

  // 1. checking out logged in and spaceId
  const res1 = getSharedData_1(sgCtx, spaceId, opt)
  if(!res1.pass) return res1.result

  // 2. handle w
  const isIndex = vT === "INDEX"
  const isPin = vT === "PINNED"
  const oState = vT === "TRASH" ? "REMOVED" : "OK"
  let key = oState === "OK" ? "createdStamp" : "updatedStamp"
  if(isPin) key = "pinStamp"

  const w: Record<string, any> = {
    oState,
    spaceId,
  }

  if(lastItemStamp) {
    if(sort === "desc") {
      w[key] = _.lt(lastItemStamp)
    }
    else {
      w[key] = _.gt(lastItemStamp)
    }
  }

  if(isPin) {
    w.pinStamp = _.gt(0)
  }
  else if(isIndex) {
    w.pinStamp = _.or(_.eq(0), _.exists(false))
  }
  else if(vT === "STATE") {
    w.stateId = stateId
  }
  else if(vT === "TAG") {
    w.tagSearched = _.in([tagId])
  }

  if(specific_ids?.length) {
    w._id = _.in(specific_ids)
  }
  else if(excluded_ids?.length) {
    w._id = _.nin(excluded_ids)
  }

  // 3. to query
  let q3 = db.collection("Content").where(w)
  q3 = q3.orderBy(key, sort).limit(limit)
  const res3 = await q3.get<Table_Content>()
  const results = res3.data ?? []

  if(results.length < 1) {
    return { code: "0000", taskId, list: [] }
  }
  mergeListIntoCtx(sgCtx, "contents", results)

  // 4. get authors
  const authors = await getAuthors(sgCtx, results)

  // 5. get my collections related to these contents
  const content_ids = results.map(v => v._id)
  const myCollections = await getMyCollectionsFromContentIds(sgCtx, content_ids)

  // 6. package contents into LiuDownloadContent[]
  const res6 = packContents(sgCtx, results, myCollections, authors)
  if(!res6.pass) {
    const result_6 = { ...res6.result, taskId }
    return result_6
  }

  // 7. turn into parcels
  const res7 = turnDownloadContentsIntoParcels(res6.list)
  
  return { code: "0000", taskId, list: res7 }
}

/** load threads from Collection table first */
async function toThreadListFromCollection(
  sgCtx: SyncGetCtx,
  atom: SyncGet_ThreadList,
  opt: OperationOpt,
) {
  const { taskId } = opt
  const {
    spaceId,
    limit = 16,
    collectType = "FAVORITE",
    emojiSpecific,
    sort = "desc",
    lastItemStamp,
  } = atom

  // 1. get shared data
  const res1 = getSharedData_1(sgCtx, spaceId, opt)
  if(!res1.pass) return res1.result

  // 2. construct query
  const w2: Record<string, any> = {
    oState: "OK",
    user: res1.myUserId,
    infoType: collectType,
    forType: "THREAD",
    spaceId,
  }
  if(collectType === "EXPRESS" && emojiSpecific) {
    w2.emoji = emojiSpecific
  }
  if(lastItemStamp) {
    if(sort === "desc") {
      w2.sortStamp = _.lt(lastItemStamp)
    }
    else {
      w2.sortStamp = _.gt(lastItemStamp)
    }
  }

  // 3. to query
  let q3 = db.collection("Collection").where(w2)
  q3 = q3.orderBy("sortStamp", sort).limit(limit)
  const res3 = await q3.get<Table_Collection>()
  const collections = res3.data ?? []

  if(collections.length < 1) {
    return { code: "0000", taskId, list: [] }
  }
  mergeListIntoCtx(sgCtx, "collections", collections)

  // 4. get corresponding contents
  const content_ids = collections.map(v => v.content_id)
  let contents = await getListViaIds<Table_Content>(
    sgCtx,
    content_ids,
    "Content",
    "contents",
  )
  contents = contents.filter(v => {
    const oState = v.oState
    return oState === "OK"
  })
  if(contents.length < 1) {
    return { code: "0000", taskId, list: [] }
  }
  contents = sortListWithIds(contents, content_ids)

  // 5. get authors
  const authors = await getAuthors(sgCtx, contents)

  // 6. package contents into LiuDownloadContent[]
  const res6 = packContents(sgCtx, contents, collections, authors)
  if(!res6.pass) {
    const result_6 = { ...res6.result, taskId }
    return result_6 
  }

  // 7. turn into parcels
  const res7 = turnDownloadContentsIntoParcels(res6.list)
  return { code: "0000", taskId, list: res7 }  
}





/***************************** helper functions *************************/


interface Gsdr_A {
  pass: false
  result: SyncGetAtomRes
}

interface Gsdr_1_B {
  pass: true
  myUserId: string
}

type GetShareDataRes_1 = Gsdr_A | Gsdr_1_B

interface PackContent_A {
  pass: false
  result: LiuErrReturn
}

interface PackContent_B {
  pass: true
  list: LiuDownloadContent[]
}

type PackContents_Res = PackContent_A | PackContent_B


function turnDownloadContentsIntoParcels(
  list: LiuDownloadContent[],
) {
  const results = list.map(v => {
    const obj: LiuDownloadParcel_A = {
      id: v._id,
      status: "has_data",
      parcelType: "content",
      content: v,
    }
    return obj
  })
  return results
}


function packContents(
  sgCtx: SyncGetCtx,
  contents: Table_Content[],
  myCollections: Table_Collection[],
  authors: LiuDownloadAuthor[],
): PackContents_Res {
  const myUserId = sgCtx.me?._id

  const list: LiuDownloadContent[] = []
  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const author = findMatchedAuthor(v, authors)
    if(!author) continue

    const isMine = Boolean(myUserId && author.user_id === myUserId)
    const myFavorite = findCollection(v, myCollections, "FAVORITE")
    const myEmoji = findCollection(v, myCollections, "EXPRESS")

    // title
    const d_title = decryptCloudData<string>(v.enc_title)
    if(!d_title.pass) return d_title
    const title = d_title.data

    // desc
    const d_desc = decryptCloudData<LiuContent[]>(v.enc_desc)
    if(!d_desc.pass) return d_desc
    const liuDesc = d_desc.data

    // images
    const d_images = decryptCloudData<Cloud_ImageStore[]>(v.enc_images)
    if(!d_images.pass) return d_images
    const images = d_images.data

    // files
    const d_files = decryptCloudData<Cloud_FileStore[]>(v.enc_files)
    if(!d_files.pass) return d_files
    const files = d_files.data
    
    const obj: LiuDownloadContent = {
      _id: v._id,
      first_id: v._id,

      isMine,
      author,
      spaceId: v.spaceId,
      spaceType: v.spaceType,

      infoType: v.infoType,
      oState: v.oState,
      visScope: v.visScope,
      storageState: v.storageState,

      title,
      liuDesc,
      images,
      files,

      calendarStamp: v.calendarStamp,
      remindStamp: v.remindStamp,
      whenStamp: v.whenStamp,
      remindMe: v.remindMe,
      emojiData: v.emojiData,
      parentThread: v.parentThread,
      parentComment: v.parentComment,
      replyToComment: v.replyToComment,
      pinStamp: v.pinStamp,

      createdStamp: v.createdStamp,
      editedStamp: v.editedStamp,

      tagIds: v.tagIds,
      tagSearched: v.tagSearched,
      stateId: v.stateId,
      config: v.config,

      levelOne: v.levelOne,
      levelOneAndTwo: v.levelOneAndTwo,

      myFavorite,
      myEmoji,
    }
    list.push(obj)
  }

  return { pass: true, list }
}

/** search my collection for content */
function findCollection(
  c: Table_Content,
  myCollections: Table_Collection[],
  collectionType: CollectionInfoType,
) {
  const content_id = c._id
  const c1 = myCollections.find(v => {
    if(v.content_id !== content_id) return false
    return v.infoType === collectionType
  })
  if(!c1) return
  const [c2] = turnCollectionsIntoDownloadOnes([c1])
  return c2
}


/** search author for content */
function findMatchedAuthor(
  c: Table_Content,
  authors: LiuDownloadAuthor[],
) {

  const isMemberInContent = Boolean(c.member)

  // 1. find matched author
  const a1 = authors.find(v => {
    if(isMemberInContent) {
      return v.member_id === c.member
    }
    return v.user_id === c.user
  })
  if(a1 || !isMemberInContent) return a1

  // 2. find again
  const a2 = authors.find(v => v.user_id === c.user)
  return a2
}


function turnCollectionsIntoDownloadOnes(
  collections: Table_Collection[],
) {
  const list: LiuDownloadCollection[] = []
  for(let i=0; i<collections.length; i++) {
    const v = collections[i]
    const obj: LiuDownloadCollection = {
      _id: v._id,
      first_id: v.first_id,
      user: v.user,
      member: v.member,
      oState: v.oState,
      emoji: v.emoji,
      operateStamp: v.operateStamp,
      sortStamp: v.sortStamp,
    }
    list.push(obj)
  }
  return list
}


async function getMyCollectionsFromContentIds(
  sgCtx: SyncGetCtx,
  content_ids: string[],
) {
  const user_id = sgCtx.me._id
  if(!user_id) return []

  // 1. query
  const w1 = {
    user: user_id,
    content_id: _.in(content_ids),
  }
  const col_1 = db.collection("Collection")
  const res1 = await col_1.where(w1).get<Table_Collection>()
  const results = res1.data ?? []
  mergeListIntoCtx(sgCtx, "collections", results)

  return results
}


interface TmpGetAuthor_1 {
  user_id: string
  space_id: string
  member_id?: string
}

async function getAuthors(
  sgCtx: SyncGetCtx,
  results: Table_Content[] | Table_Collection[],
) {
  const list1: TmpGetAuthor_1[] = []
  const authors: LiuDownloadAuthor[] = []

  // 1. package list1
  for(let i=0; i<results.length; i++) {
    const v = results[i]
    const { user, member, spaceId } = v

    // 1.1 checking out if the user & spaceId is in list1
    const tmp1 = list1.find(v1 => {
      return v1.user_id === user && v1.space_id === spaceId
    })
    if(tmp1) continue

    // 1.2 if not, push into list1
    list1.push({ 
      user_id: user, 
      space_id: spaceId, 
      member_id: member,
    })
  }

  // 2. get authors from sgCtx
  for(let i=0; i<list1.length; i++) {
    const v = list1[i]
    const { user_id, space_id } = v
    const author = sgCtx.authors.find(v1 => {
      return v1.user_id === user_id && v1.space_id === space_id
    })
    if(!author) continue
    authors.push(author)
    list1.splice(i, 1)
    i--
  }
  
  // 3. if list1.length < 1, return data
  if(list1.length < 1) {
    return authors
  }

  // 4. get member_ids
  let member_ids: string[] = []
  list1.forEach(v => {
    if(v.member_id) member_ids.push(v.member_id)
  })
  member_ids = valTool.uniqueArray(member_ids)

  // 5. get members first
  let members: Table_Member[] = []
  if(member_ids.length > 0) {
    members = await getListViaIds(sgCtx, member_ids, "Member", "members")
    let tmpAuthors = generateAuthorsFromMembers(sgCtx, members, list1)
    authors.push(...tmpAuthors)
  }

  if(list1.length < 1) {
    return authors
  }

  // 6. get user_ids
  let user_ids: string[] = []
  list1.forEach(v => {
    user_ids.push(v.user_id)
  })
  user_ids = valTool.uniqueArray(user_ids)

  // 7. construct query for Member
  const w7 = {
    user: _.in(user_ids),
    spaceType: "ME",
  }
  const col_7 = db.collection("Member")
  const res7 = await col_7.where(w7).get<Table_Member>()
  members = res7.data ?? []
  const tmpAuthors_7 = generateAuthorsFromMembers(sgCtx, members, list1)
  authors.push(...tmpAuthors_7)
  return authors
}


function generateAuthorsFromMembers(
  sgCtx: SyncGetCtx,
  members: Table_Member[],
  list1: TmpGetAuthor_1[]
) {
  const authors: LiuDownloadAuthor[] = []

  for(let i=0; i<members.length; i++) {
    const v = members[i]
    const { _id, user, spaceId } = v
    const author: LiuDownloadAuthor = {
      user_id: user,
      space_id: spaceId,
      member_id: _id,
      member_name: v.name,
      member_avatar: v.avatar,
      member_oState: v.oState,
    }
    authors.push(author)
    const idx = list1.findIndex(v1 => {
      return v1.space_id === spaceId && v1.user_id === user
    })
    if(idx >= 0) {
      list1.splice(idx, 1)
    }
  }

  sgCtx.authors.push(...authors)
  return authors
}

async function getListViaIds<T extends SyncGetTable>(
  sgCtx: SyncGetCtx,
  ids: string[],
  tableName: TableName,
  key: SyncGetCtxKey,
) {
  const list: T[] = []
  for(let i=0; i<ids.length; i++) {
    const v = ids[i]
    const d = sgCtx[key].find(v1 => v1._id === v)
    if(!d) continue
    list.push(d as T)
    ids.splice(i, 1)
    i--
  }
  if(ids.length < 1) {
    return list
  }

  const q = db.collection(tableName).where({ _id: _.in(ids) })
  const res = await q.get<T>()
  const newList = res.data ?? []
  if(newList.length < 1) return list
  mergeListIntoCtx(sgCtx, key, newList)
  list.push(...newList)
  return list
}


function sortListWithIds<T extends SyncGetTable>(
  list: T[],
  ids: string[],
) {
  const newList: T[] = []
  for(let i=0; i<ids.length; i++) {
    const id = ids[i]
    const index = list.findIndex(v => v._id === id)
    if(index >= 0) {
      newList.push(list[index])
    }
  }
  return newList
}


/** checking out if i logged in and space ids */
function getSharedData_1(
  sgCtx: Partial<SyncGetCtx>,
  spaceId: string,
  opt: OperationOpt,
): GetShareDataRes_1 {
  const { taskId } = opt
  const { me, space_ids = [] } = sgCtx
  if(!me) {
    return { 
      pass: false, 
      result: { code: "E4003", errMsg: "you are not logged in", taskId }
    }
  }

  const res = space_ids.includes(spaceId)
  if(!res) {
    return {
      pass: false,
      result: { code: "E4003", errMsg: "you are not in the workspace", taskId }
    }
  }

  return { pass: true, myUserId: me._id }
}


/******************************** init sgCtx ***************************/
function initSgCtx(
  user: Table_User,
  space_ids: string[],
) {
  const sgCtx: SyncGetCtx = {
    users: [user],
    members: [],
    contents: [],
    collections: [],
    authors: [],
    me: user,
    space_ids,
  }
  return sgCtx
}


function mergeListIntoCtx<T extends SyncGetTable>(
  sgCtx: SyncGetCtx,
  key: SyncGetCtxKey,
  results: T[],
) {
  const list = sgCtx[key] as T[]
  for(let i=0; i<results.length; i++) {
    const v = results[i]
    const idx = list.findIndex(v1 => v1._id === v._id)
    if(idx < 0) {
      list.push(v)
    }
    else {
      list[idx] = v
    }
  }
}


function preCheck() {

  // 1. checking out the AES key of backend
  const backendAESKey = getAESKey()
  if(!backendAESKey) {
    return { code: "E5001", errMsg: "no backend AES key" }
  }

}



function checkBody(
  body: Record<string, any>,
) {

  const { operateType, atoms } = body
  if(operateType !== "general_sync") {
    return { code: "E4000", errMsg: "operateType is not equal to general_sync" }
  }

  const Sch_Atoms = vbot.array(Sch_SyncGetAtom, [
    vbot.minLength(1),
    vbot.maxLength(5),
  ])
  const res1 = vbot.safeParse(Sch_Atoms, atoms)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg }
  }

  return null
}


