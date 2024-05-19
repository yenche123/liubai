// Function Name: sync-get

import { 
  verifyToken,
  getDocAddId,
  checker,
  getAESKey,
  encryptDataWithAES,
  getDecryptedBody,
  getEncryptedData,
  valTool,
} from "@/common-util"
import {
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
      toThreadList(sgCtx, v, opt)
    }

  }


}



async function toThreadList(
  sgCtx: SyncGetCtx,
  atom: SyncGet_ThreadList,
  opt: OperationOpt,
) {
  const vT = atom.viewType
  if(vT === "FAVORITE") {

  }
  else {
    toThreadListFromContent(sgCtx, atom, opt)
  }

}


interface Content_With_Collection extends Table_Content {

}

/** load threads from Content table */
async function toThreadListFromContent(
  sgCtx: SyncGetCtx,
  atom: SyncGet_ThreadList,
  opt: OperationOpt,
) {
  const { taskId } = opt
  const { 
    spaceId, 
    viewType: vT, 
    limit = 16, 
    sort = "desc", 
    lastItemStamp,
    specific_ids,
    excluded_ids,
    stateId,
  } = atom

  // 0. checking out more
  if(vT === "STATE" && !stateId) {
    return { code: "E4000", errMsg: "stateId is required", taskId }
  }

  // 1. checking out logged in and spaceId
  const res1 = getSharedData_1(sgCtx, spaceId, opt)
  if(!res1.pass) return res1

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
  mergeList(sgCtx, "contents", results)

  






  
}

/** load threads from Collection table first */
async function toThreadListFromCollection(
  sgCtx: SyncGetCtx,
  atom: SyncGet_ThreadList,
  opt: OperationOpt,
) {

  
}





/***************************** helper functions *************************/

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
    const tmp1 = list1.find(v1 => {
      return v1.user_id === user && v1.space_id === spaceId
    })
    if(tmp1) continue
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
    members = await getList(sgCtx, member_ids, "Member", "members")
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

  // 7. get personal workspaces by user_ids
  const w7 = {
    infoType: "ME",
    owner: _.in(user_ids),
  }
  const workspaces = await db.collection("Workspace").where(w7).get()
  


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

async function getList<T extends SyncGetTable>(
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
  mergeList(sgCtx, key, newList)
  list.push(...newList)
  return list
}


interface Gsdr_A {
  pass: false
  result: SyncGetAtomRes
}

interface Gsdr_1_B {
  pass: true
}

type GetShareDataRes_1 = Gsdr_A | Gsdr_1_B

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

  return { pass: true }
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


function mergeList<T extends SyncGetTable>(
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


