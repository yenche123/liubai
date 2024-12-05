// Function Name: sync-get

import { 
  verifyToken,
  checker,
  getAESKey,
  getDecryptedBody,
  getEncryptedData,
  valTool,
  decryptEncData,
  sortListWithIds,
} from "@/common-util"
import {
  Sch_SyncGetAtom,
} from "@/common-types"
import type {
  SyncGetAtom,
  SyncGetCtx,
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
  LiuDownloadParcel_A,
  Res_SyncGet_Cloud,
  SyncGet_CheckContents,
  SyncGet_ThreadData,
  SyncGet_Draft,
  Table_Draft,
  LiuDownloadParcel_B,
  LiuDownloadDraft,
  SyncGet_CommentList,
  SyncGet_CommentList_A,
  SyncGet_CommentList_B,
  SyncGet_CommentList_C,
  SyncGet_CommentList_D,
  CommonPass_A,
  SyncGet_ContentList,
} from "@/common-types"
import { getNowStamp, DAY, HOUR } from "@/common-time"
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
  const results = await toRun(sgCtx, res3.newBody)
  
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

async function toRun(
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
    else if(taskType === "content_list") {
      res1 = await toContentList(sgCtx, v, opt)
    }
    else if(taskType === "check_contents") {
      res1 = await toCheckContents(sgCtx, v, opt)
    }
    else if(taskType === "thread_data") {
      res1 = await toThreadData(sgCtx, v, opt)
    }
    else if(taskType === "draft_data") {
      res1 = await toDraftData(sgCtx, v, opt)
    }
    else if(taskType === "comment_list") {
      res1 = await toCommentList(sgCtx, v, opt)
    }

    if(!res1) {
      res1 = { code: "E5001", taskId, errMsg: "the taskType cannot match"  }
    }

    results.push(res1)
  }

  return results
}

async function toContentList(
  sgCtx: SyncGetCtx,
  atom: SyncGet_ContentList,
  opt: OperationOpt,
): Promise<SyncGetAtomRes> {
  // 1. get parameters
  const { 
    spaceId,
    loadType,
    limit = 16,
    lastItemStamp,
  } = atom

  // 2. construct query
  let key = loadType === "CREATE_FIRST" ? "createdStamp" : "editedStamp"
  const w: Record<string, any> = {
    oState: "OK",
    spaceId,
  }
  if(lastItemStamp) {
    w[key] = _.lt(lastItemStamp)
  }

  // 3. to query
  let q3 = db.collection("Content").where(w)
  q3 = q3.orderBy(key, "desc").limit(limit)
  const res3 = await q3.get<Table_Content>()
  const results = res3.data ?? []

  // 4. get shared data
  const res4 = await getSharedData_3(sgCtx, results, opt)
  return res4
}


async function toCommentList(
  sgCtx: SyncGetCtx,
  atom: SyncGet_CommentList,
  opt: OperationOpt,
) {
  const { loadType } = atom

  let res1: SyncGetAtomRes = { 
    code: "E5001", 
    taskId: opt.taskId, 
    errMsg: "the loadType of SyncGet_CommentList cannot match",
  }

  if(loadType === "under_thread") {
    res1 = await commentsUnderThread(sgCtx, atom, opt)
  }
  else if(loadType === "find_children") {
    res1 = await findChildrenComments(sgCtx, atom, opt)
  }
  else if(loadType === "find_parent") {
    res1 = await findParentComments(sgCtx, atom, opt)
  }
  else if(loadType === "find_hottest") {
    res1 = await findHottestComments(sgCtx, atom, opt)
  }
 
  return res1
}

function _getScore(c: Table_Content) {
  const commentNum = c.levelOneAndTwo ?? 0
  const reactionNum = c.emojiData.total
  const score = (5 * commentNum) + (3 * reactionNum)
  return score
}

async function findHottestComments(
  sgCtx: SyncGetCtx,
  atom: SyncGet_CommentList_D,
  opt: OperationOpt,
) {
  const {
    commentId,
  } = atom

  // 1. construct query
  const LIMIT = 10
  const w1: Record<string, any> = {
    replyToComment: commentId,
    oState: "OK",
    infoType: "COMMENT",
  }

  // 2. to query
  let q2 = db.collection("Content").where(w1)
  q2 = q2.orderBy("createdStamp", "asc").limit(LIMIT)
  const res2 = await q2.get<Table_Content>()
  const contents = res2.data ?? []

  // 3. sort
  const _sort = (v1: Table_Content, v2: Table_Content) => {
    const score1 = _getScore(v1)
    const score2 = _getScore(v2)
    return score2 - score1
  }
  contents.sort(_sort)
  
  // 4. get shared data
  const res4 = await getSharedData_3(sgCtx, contents, opt)
  return res4
}


async function findParentComments(
  sgCtx: SyncGetCtx,
  atom: SyncGet_CommentList_C,
  opt: OperationOpt,
) {
  const {
    parentWeWant,
    grandparent,
    batchNum = 2,
  } = atom

  let all_ids = []
  let ids = [parentWeWant]
  if(grandparent && grandparent !== parentWeWant) {
    ids.push(grandparent)
  }

  const _sort = (v1: Table_Content, v2: Table_Content) => {
    return v1.createdStamp - v2.createdStamp
  }

  let list: Table_Content[] = []
  for(let i=0; i<batchNum; i++) {

    const res1 = await getListViaIds<Table_Content>(sgCtx, ids, "Content", "contents")
    if(res1.length < 1) break

    res1.sort(_sort)
    list.splice(0, 0, ...res1)

    const firstComment = list[0]
    const { replyToComment, parentComment } = firstComment
    if(!replyToComment) break

    all_ids.push(...ids)
    ids = []
    if(!all_ids.includes(replyToComment)) {
      ids.push(replyToComment)
    }
    if(parentComment && parentComment !== replyToComment) {
      if(!all_ids.includes(parentComment)) ids.push(parentComment)
    }
  }

  const res3 = await getSharedData_3(sgCtx, list, opt)
  return res3
}

async function findChildrenComments(
  sgCtx: SyncGetCtx,
  atom: SyncGet_CommentList_B,
  opt: OperationOpt,
) {
  const {
    commentId,
    lastItemStamp,
    sort = "asc",
    limit = 9,
  } = atom

  // 1. construct query
  const w1: Record<string, any> = {
    replyToComment: commentId,
    oState: "OK",
    infoType: "COMMENT",
  }
  if(lastItemStamp) {
    if(sort === "desc") {
      w1.createdStamp = _.lt(lastItemStamp)
    }
    else {
      w1.createdStamp = _.gt(lastItemStamp)
    }
  }

  // 2. to query
  let q2 = db.collection("Content").where(w1)
  q2 = q2.orderBy("createdStamp", sort).limit(limit)
  const res2 = await q2.get<Table_Content>()
  const contents = res2.data ?? []

  // 3. get shared data
  const res4 = await getSharedData_3(sgCtx, contents, opt)
  return res4
}

async function commentsUnderThread(
  sgCtx: SyncGetCtx,
  atom: SyncGet_CommentList_A,
  opt: OperationOpt,
) {
  const { 
    targetThread, 
    lastItemStamp, 
    sort = "asc",
    limit = 9,
  } = atom

  // 1. construct query
  const w1: Record<string, any> = {
    parentThread: targetThread,
    parentComment: _.exists(false),
    replyToComment: _.exists(false),
    oState: "OK",
    infoType: "COMMENT",
  }

  if(lastItemStamp) {
    if(sort === "desc") {
      w1.createdStamp = _.lt(lastItemStamp)
    }
    else {
      w1.createdStamp = _.gt(lastItemStamp)
    }
  }

  // 2. to query
  let q2 = db.collection("Content").where(w1)
  q2 = q2.orderBy("createdStamp", sort).limit(limit)
  const res2 = await q2.get<Table_Content>()
  const contents = res2.data ?? []

  // 3. get shared data
  const res4 = await getSharedData_3(sgCtx, contents, opt)
  return res4
}


async function toDraftData(
  sgCtx: SyncGetCtx,
  atom: SyncGet_Draft,
  opt: OperationOpt,
) {
  const { taskId } = opt

  // 1. checking out input
  const {
    draft_id,
    threadEdited,
    commentEdited,
    spaceId
  } = atom
  if(!draft_id && !threadEdited && !commentEdited && !spaceId) {
    return { 
      code: "E4000", 
      taskId, 
      errMsg: "some parameters are required",
    }
  }

  // 2. get data using different methods
  let res2: SyncGetAtomRes = {
    code: "E5001",
    taskId,
    errMsg: "toDraftData failed",
  }
  if(draft_id) {
    res2 = await toGetDraftById(sgCtx, draft_id, opt)
  }
  else if(threadEdited) {
    res2 = await toGetDraftByThreadId(sgCtx, threadEdited, opt)
  }
  else if(commentEdited) {
    res2 = await toGetDraftByCommentId(sgCtx, commentEdited, opt)
  }
  else if(spaceId) {
    res2 = await toGetDraftBySpaceId(sgCtx, spaceId, opt)
  }
  
  return res2
}

async function toGetDraftBySpaceId(
  sgCtx: SyncGetCtx,
  spaceId: string,
  opt: OperationOpt,
) {
  const myUserId = sgCtx.me._id

  // 1. construct query
  const w: Record<string, any> = {
    user: myUserId,
    infoType: "THREAD",
    oState: "OK",
    spaceId,
    threadEdited: _.exists(false),
    commentEdited: _.exists(false),
  }

  // 2. get shared data
  const res2 = await getSharedData_5(sgCtx, w, opt)
  return res2
}

async function toGetDraftByThreadId(
  sgCtx: SyncGetCtx,
  threadEdited: string,
  opt: OperationOpt,
) {
  const myUserId = sgCtx.me._id

  // 1. construct query
  const w: Partial<Table_Draft> = {
    threadEdited,
    user: myUserId,
  }

  // 2. get shared data
  const res2 = await getSharedData_5(sgCtx, w, opt)
  return res2
}

async function toGetDraftByCommentId(
  sgCtx: SyncGetCtx,
  commentEdited: string,
  opt: OperationOpt,
) {
  const myUserId = sgCtx.me._id

  // 1. construct query
  const w: Partial<Table_Draft> = {
    commentEdited,
    user: myUserId,
  }

  // 2. get shared data
  const res2 = await getSharedData_5(sgCtx, w, opt)
  return res2
}

async function toGetDraftById(
  sgCtx: SyncGetCtx,
  draft_id: string,
  opt: OperationOpt,
) {
  // 1. get draft data
  const col = db.collection("Draft")
  const res1 = await col.doc(draft_id).get<Table_Draft>()
  const d = res1.data

  // 2. get shared data
  const res2 = await getSharedData_4(sgCtx, draft_id, d, opt)
  return res2
}



async function toThreadData(
  sgCtx: SyncGetCtx,
  atom: SyncGet_ThreadData,
  opt: OperationOpt,
): Promise<SyncGetAtomRes> {
  const content_id = atom.id

  // 1. get shared data
  const res2 = await getSharedData_2(sgCtx, [content_id], opt)
  return res2
}


async function toCheckContents(
  sgCtx: SyncGetCtx,
  atom: SyncGet_CheckContents,
  opt: OperationOpt,
): Promise<SyncGetAtomRes> {
  const ids = atom.ids

  // 1. get shared data
  const res2 = await getSharedData_2(sgCtx, ids, opt)
  return res2
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
    lastItemStamp,
    specific_ids,
    excluded_ids,
    tagId,
    stateId,
  } = atom
  let sort = atom.sort ?? "desc"

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

  // 2.1 handle w
  const isIndex = vT === "INDEX"
  const isCalendar = vT === "CALENDAR"
  const isPin = vT === "PINNED"
  const isTrash = vT === "TRASH"
  const isTodayFuture = vT === "TODAY_FUTURE"
  const isPast = vT === "PAST"
  const oState = isTrash ? "REMOVED" : "OK"

  const w: Record<string, any> = {
    oState,
    infoType: "THREAD",
    spaceId,
  }

  if(isCalendar) {
    const now = getNowStamp()
    const s1 = now - DAY
    const s2 = now + DAY + (HOUR * 2)
    w.calendarStamp = _.and(_.gt(s1), _.lte(s2))
  }
  else if(isTodayFuture) {
    sort = "asc"
    const now = getNowStamp()
    const s1 = now - DAY
    w.calendarStamp = _.gt(s1)
  }
  else if(isPast) {
    const now = getNowStamp()
    w.calendarStamp = _.lt(now)
  }
  else if(isPin) {
    w.pinStamp = _.gt(0)
  }
  else if(isIndex) {
    w.pinStamp = _.or(_.eq(0), _.exists(false))
  }
  else if(isTrash) {
    w.removedStamp = _.gt(0)
  }
  else if(vT === "STATE") {
    w.stateId = stateId
  }
  else if(vT === "TAG") {
    w.tagSearched = _.in([tagId])
  }

  // 2.2 handle specific_ids and excluded_ids
  if(specific_ids?.length) {
    w._id = _.in(specific_ids)
  }
  else if(excluded_ids?.length) {
    w._id = _.nin(excluded_ids)
  }

  // 2.3 handle lastItemStamp using key
  let key = oState === "OK" ? "createdStamp" : "updatedStamp"
  if(isCalendar || isTodayFuture || isPast) {
    key = "calendarStamp"
  }
  else if(isPin) key = "pinStamp"
  else if(isTrash) key = "removedStamp"

  if(lastItemStamp) {
    if(sort === "desc") {
      w[key] = _.lt(lastItemStamp)
    }
    else {
      w[key] = _.gt(lastItemStamp)
    }
  }


  // 3. to query
  let q3 = db.collection("Content").where(w)
  q3 = q3.orderBy(key, sort).limit(limit)
  const res3 = await q3.get<Table_Content>()
  const results = res3.data ?? []

  // 4. get shared data
  const res4 = await getSharedData_3(sgCtx, results, opt)
  return res4
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
    const result_6 = { ...res6.err, taskId }
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

// package draft
function getSharedData_6(
  parcel: LiuDownloadParcel_B,
  d: Table_Draft,
  opt: OperationOpt,
): SyncGetAtomRes {
  const { taskId } = opt

  const res6 = decryptEncData(d)
  if(!res6.pass) {
    const result_6 = { ...res6.err, taskId }
    return result_6
  }
  const draft: LiuDownloadDraft = {
    _id: d._id,
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

    title: res6.title,
    liuDesc: res6.liuDesc,
    images: res6.images,
    files: res6.files,

    whenStamp: d.whenStamp,
    remindMe: d.remindMe,
    tagIds: d.tagIds,
    stateId: d.stateId,
    editedStamp: d.editedStamp,
  }

  parcel.status = "has_data"
  parcel.draft = draft
  return { code: "0000", taskId, list: [parcel] }
}

// handle draft without draft_id
async function getSharedData_5(
  sgCtx: SyncGetCtx,
  w: Partial<Table_Draft>,
  opt: OperationOpt,
): Promise<SyncGetAtomRes> {
  const { taskId } = opt

  // 1. get draft data
  const col = db.collection("Draft")
  const q = col.where(w).orderBy("editedStamp", "desc")
  const res1 = await q.getOne<Table_Draft>()
  const d = res1.data

  // 2. if no data
  if(!d) {
    return { code: "E4004", taskId, errMsg: "draft not found" }
  }

  // 3. construct parcel and get shared data
  const parcel: LiuDownloadParcel_B = {
    id: d._id,
    status: "has_data",
    parcelType: "draft",
  }
  const res3 = getSharedData_6(parcel, d, opt)
  return res3
}


// handle draft with draft_id
async function getSharedData_4(
  sgCtx: SyncGetCtx,
  draft_id: string,
  d: Table_Draft | null,
  opt: OperationOpt,
): Promise<SyncGetAtomRes> {
  const { taskId } = opt
  // 1. construct parcel
  const parcel: LiuDownloadParcel_B = {
    id: draft_id,
    status: "not_found",
    parcelType: "draft"
  }

  // 2. if no data
  if(!d) {
    return { code: "0000", taskId, list: [parcel]  }
  }

  // 3. checking auth out
  const myUserId = sgCtx.me._id
  if(d.user !== myUserId) {
    parcel.status = "no_auth"
    return { code: "0000", taskId, list: [parcel] }
  }

  // 4. get shared data
  const res = getSharedData_6(parcel, d, opt)
  return res
}

async function getSharedData_3(
  sgCtx: SyncGetCtx,
  contents: Table_Content[],
  opt: OperationOpt,
): Promise<SyncGetAtomRes> {
  const { taskId } = opt
  if(contents.length < 1) {
    return { code: "0000", taskId, list: [] }
  }
  mergeListIntoCtx(sgCtx, "contents", contents)

  // 1. get authors
  const authors = await getAuthors(sgCtx, contents)

  // 2. get my collections related to these contents
  const content_ids = contents.map(v => v._id)
  const myCollections = await getMyCollectionsFromContentIds(sgCtx, content_ids)

  // 3. package contents into LiuDownloadContent[]
  const res3 = packContents(sgCtx, contents, myCollections, authors)
  if(!res3.pass) {
    const result_3 = { ...res3.err, taskId }
    return result_3
  }

  // 4. turn into parcels
  const res4 = turnDownloadContentsIntoParcels(res3.list)
  
  return { code: "0000", taskId, list: res4 }
}


// get contents via ids
async function getSharedData_2(
  sgCtx: SyncGetCtx,
  ids: string[],
  opt: OperationOpt,
): Promise<SyncGetAtomRes> {
  // 1. get taskId
  const { taskId } = opt

  // 2. get contents
  const contents = await getListViaIds<Table_Content>(sgCtx, ids, "Content", "contents")

  // 3. construct list
  let list = ids.map(v => {
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

  // 6. get authors
  const authors = await getAuthors(sgCtx, contents)

  // 7. get my collections related to these contents
  const content_ids = contents.map(v => v._id)
  const myCollections = await getMyCollectionsFromContentIds(sgCtx, content_ids)

  // 8. package contents into LiuDownloadContent[]
  const res8 = packContents(sgCtx, contents, myCollections, authors)
  if(!res8.pass) {
    const result_8 = { ...res8.err, taskId }
    return result_8
  }
  
  // 9. package liuDownloadContents into list
  const res9 = res8.list
  list = list.map(v => {
    if(v.status !== "has_data") return v
    const d9 = res9.find(v1 => v1._id === v.id)
    if(!d9) {
      v.status = "not_found"
    }
    else {
      v.content = d9
    }
    return v
  })
  return { code: "0000", taskId, list }  
}

interface PackContent_B {
  pass: true
  list: LiuDownloadContent[]
}

type PackContents_Res = CommonPass_A | PackContent_B


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

    // decrypt title, liuDesc, images, files
    const res = decryptEncData(v)
    if(!res.pass) return res
    const {
      title,
      images,
      liuDesc,
      files,
    } = res
    
    const obj: LiuDownloadContent = {
      _id: v._id,
      first_id: v.first_id,

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
      removedStamp: v.removedStamp,

      tagIds: v.tagIds,
      tagSearched: v.tagSearched,
      stateId: v.stateId,
      config: v.config,

      levelOne: v.levelOne,
      levelOneAndTwo: v.levelOneAndTwo,
      aiCharacter: v.aiCharacter,

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


