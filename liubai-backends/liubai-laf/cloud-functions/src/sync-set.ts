import { 
  checkIfUserSubscribed, 
  verifyToken,
  getDocAddId,
} from "@/common-util"
import type { 
  LiuRqReturn,
  SyncSetAtom,
  Table_User,
  Table_Content,
  Table_Draft,
  Table_Member,
  Table_Workspace,
  SyncSetCtxAtom,
  SyncSetCtx,
} from "@/common-types"
import { liuUploadTasks } from "@/common-types"
import { getNowStamp, SECONED, MINUTE } from "@/common-time"
import cloud from '@lafjs/cloud'

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}

  // 1. pre-check
  const res1 = preCheck(body)
  if(res1) return res1
  
  // 2. verify token
  const vRes = await verifyToken(ctx, body)
  const user = vRes.userData
  const workspaces = vRes.workspaces ?? []
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }

  // 3. to init ctx
  const ssCtx = initSyncSetCtx(user, workspaces)

  // 4. to execute
  toExecute(body, ssCtx)
  
  
}


function preCheck(
  body: Record<string, any>,
): LiuRqReturn | null {

  const { operateType, atoms } = body
  if(operateType !== "general_sync") {
    return { code: "E4000", errMsg: "operateType is not equal to general_sync" }
  }

  if(!atoms || !Array.isArray(atoms)) {
    return { code: "E4000", errMsg: "no atoms in body" }
  }

  if(atoms.length < 1) {
    return { code: "E4000" , errMsg: "atoms.length is meant to be bigger than 0" }
  }

  if(atoms.length > 10) {
    return { 
      code: "E4000" , 
      errMsg: "atoms.length is meant to be smaller than or equal to 10", 
    }
  }

  const list = atoms as SyncSetAtom[]
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const taskType = v?.taskType
    if(!taskType) {
      return { code: "E4000", errMsg: `one of taskType is empty` }
    }
    const existed = liuUploadTasks.includes(taskType)
    if(!existed) {
      return { code: "E4000", errMsg: "one of taskType is not in liuUploadTasks" }
    }

    const thread = v?.thread
    const comment = v?.comment
    const draft = v?.draft
    const member = v?.member
    const workspace = v?.workspace

    if(taskType === "content-post" && (!thread && !comment)) {
      return { 
        code: "E4000", 
        errMsg: "thread or comment is required when taskType is content-post", 
      }
    }

    const isThread = taskType.startsWith("thread-")
    if(isThread && !thread) {
      return { 
        code: "E4000", 
        errMsg: "thread is required when taskType starts with thread-",
      }
    }

    const isComment = taskType.startsWith("comment-")
    if(isComment && !comment) {
      return { 
        code: "E4000", 
        errMsg: "comment is required when taskType starts with comment-",
      }
    }

    const isDraft = taskType.startsWith("draft-")
    if(isDraft && !draft) {
      return { 
        code: "E4000", 
        errMsg: "draft is required when taskType starts with draft-",
      }
    }

    const isWorkspace = taskType.startsWith("workspace-")
    if(isWorkspace && !workspace) {
      return { 
        code: "E4000", 
        errMsg: "workspace is required when taskType starts with workspace-",
      }
    }

    const isMember = taskType.startsWith("member-")
    if(isMember && !member) {
      return { 
        code: "E4000", 
        errMsg: "member is required when taskType starts with member-",
      }
    }

  }

  return null
}

// 有一个核心的逻辑: 提供一个上下文的 map 存储所有已查出来的数据和待更新的数据
// 这样队列里的操作，如果有获取重复的数据时，不需要查询多次了
// 更新时同理，若有更新一条数据多次时，只需要更新一次

function toExecute(
  body: Record<string, any>,
  ssCtx: SyncSetCtx,
) {



}

function initSyncSetCtx(
  user: Table_User,
  space_ids: string[],
) {
  const ssCtx: SyncSetCtx = {
    content: new Map<string, SyncSetCtxAtom<Table_Content>>(),
    draft: new Map<string, SyncSetCtxAtom<Table_Draft>>(),
    member: new Map<string, SyncSetCtxAtom<Table_Member>>(),
    workspace: new Map<string, SyncSetCtxAtom<Table_Workspace>>(),
    me: user,
    space_ids,
  }
  return ssCtx
}

// get a row data from map or database
async function getData<T>(
  ssCtx: SyncSetCtx,
  key: keyof SyncSetCtx,
  id: string,
) {

  if(typeof key !== "string") {
    throw new Error("key must be string")
  }

  const map = ssCtx[key] as Map<string, SyncSetCtxAtom<T>>
  const row = map.get(id)
  if(row) {
    return row.data
  }

  const col_name = key[0].toUpperCase() + key.substring(1)
  const res = await db.collection(col_name).doc(id).get<T>()
  const d = res.data
  if(!d) return null

  const atom: SyncSetCtxAtom<T> = { data: d }
  map.set(id, atom)
  return d
}

// update part data
async function updatePartData<T>(
  ssCtx: SyncSetCtx,
  key: keyof SyncSetCtx,
  id: string,
  partData: Partial<T>,
) {

  if(typeof key !== "string") {
    throw new Error("key must be string")
  }

  const map = ssCtx[key] as Map<string, SyncSetCtxAtom<T>>
  const row = map.get(id)
  if(row) {
    const newData = {
      ...row.updateData,
      ...partData,
    }
    row.data = { ...row.data, ...partData }
    row.updateData = newData
    map.set(id, row)
    return
  }

  const col_name = key[0].toUpperCase() + key.substring(1)
  const res = await db.collection(col_name).doc(id).get<T>()
  const d = res.data
  if(!d) return

  const newRow: SyncSetCtxAtom<T> = {
    data: { ...d, ...partData },
    updateData: partData,
  }
  map.set(id, newRow)
}


// insert data
// if ok, return a new id
async function insertData<T extends Table_Content | Table_Draft>(
  ssCtx: SyncSetCtx,
  key: "content" | "draft",
  data: Partial<T>,
) {
  const now = getNowStamp()
  const newData: Partial<T> = {
    insertedStamp: now,
    updatedStamp: now,
    ...data,
  }
  const col_name = key[0].toUpperCase() + key.substring(1)
  const res = await db.collection(col_name).add(newData)
  const id = getDocAddId(res)
  if(!id) return

  const completedData = { ...newData, _id: id } as T
  const map = ssCtx[key] as Map<string, SyncSetCtxAtom<T>>
  const atom: SyncSetCtxAtom<T> = { data: completedData }
  map.set(id, atom)
  return id
}
