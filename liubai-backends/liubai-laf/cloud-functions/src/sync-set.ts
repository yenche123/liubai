import { 
  checkIfUserSubscribed, 
  verifyToken,
  getDocAddId,
  checker,
  getAESKey,
  encryptDataWithAES,
  getEncryptedData,
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
  LiuUploadTask,
  LiuUploadThread,
  LiuUploadComment,
  SyncSetAtomRes,
  CryptoCipherAndIV,
  OState,
  Res_SyncSet_Cloud,
} from "@/common-types"
import { 
  Sch_Simple_SyncSetAtom,
  Sch_Cloud_ImageStore,
  Sch_Cloud_FileStore,
  Sch_ContentConfig,
  Sch_LiuRemindMe,
} from "@/common-types"
import { 
  getNowStamp, 
  getBasicStampWhileAdding,
  SECONED, 
  MINUTE, 
} from "@/common-time"
import cloud from '@lafjs/cloud'
import * as vbot from "valibot"

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
  const results = await toExecute(body, ssCtx)

  // 5. construct response
  const res5: Res_SyncSet_Cloud = {
    results,
    plz_enc_results: results,
  }
  const encRes = getEncryptedData(res5, vRes)
  if(!encRes.data || encRes.rqReturn) {
    return encRes.rqReturn ?? { code: "E5001", errMsg: "getEncryptedData failed" }
  }
  
  return { code: "0000", data: encRes.data }
}


const need_thread_evts: LiuUploadTask[] = [
  "thread-edit",
  "thread-hourglass",
  "undo_thread-hourglass",
  "thread-state",
  "undo_thread-state",
  "thread-pin",
  "undo_thread-pin",
  "thread-tag",
  "thread-delete",
  "undo_thread-delete",
  "thread-delete_forever",
  "thread-restore",
]

const need_comment_evts: LiuUploadTask[] = [
  "comment-edit",
  "comment-delete",
]

const need_workspace_evts: LiuUploadTask[] = [
  "workspace-tag",
  "workspace-state_config",
]

const need_member_evts: LiuUploadTask[] = [
  "member-avatar",
  "member-nickname",
]

const need_draft_evts: LiuUploadTask[] = [
  "draft-set",
  "draft-clear",
]

const need_collection_evts: LiuUploadTask[] = [
  "collection-favorite",
  "undo_collection-favorite",
  "collection-react",
  "undo_collection-react",
]

function preCheck(
  body: Record<string, any>,
): LiuRqReturn | null {

  // 1. checking out the AES key of backend
  const backendAESKey = getAESKey()
  if(!backendAESKey) {
    return { code: "E5001", errMsg: "no backend AES key" }
  }

  // 2. other
  const { operateType, atoms } = body
  if(operateType !== "general_sync") {
    return { code: "E4000", errMsg: "operateType is not equal to general_sync" }
  }

  const Sch_Atoms = vbot.array(Sch_Simple_SyncSetAtom, [
    vbot.minLength(1),
    vbot.maxLength(10),
  ])
  const res1 = vbot.safeParse(Sch_Atoms, atoms)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg }
  }

  const list = atoms as SyncSetAtom[]
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const {
      taskType,
      thread,
      comment,
      draft,
      member,
      workspace,
      collection,
    } = v

    if(taskType === "content-post" && (!thread && !comment)) {
      return { 
        code: "E4000", 
        errMsg: "thread or comment is required when taskType is content-post", 
      }
    }

    const isThread = need_thread_evts.includes(taskType)
    if(isThread && !thread) {
      return { 
        code: "E4000", 
        errMsg: "thread is required when taskType is in need_thread_evts",
      }
    }

    const isComment = need_comment_evts.includes(taskType)
    if(isComment && !comment) {
      return { 
        code: "E4000", 
        errMsg: "comment is required when taskType is in need_comment_evts",
      }
    }

    const isDraft = need_draft_evts.includes(taskType)
    if(isDraft && !draft) {
      return { 
        code: "E4000", 
        errMsg: "draft is required when taskType is in need_draft_evts",
      }
    }

    const isWorkspace = need_workspace_evts.includes(taskType)
    if(isWorkspace && !workspace) {
      return { 
        code: "E4000", 
        errMsg: "workspace is required when taskType is in need_workspace_evts",
      }
    }

    const isMember = need_member_evts.includes(taskType)
    if(isMember && !member) {
      return { 
        code: "E4000", 
        errMsg: "member is required when taskType is in need_member_evts",
      }
    }

    const isCollection = need_collection_evts.includes(taskType)
    if(isCollection && !collection) {
      return {
        code: "E4000", 
        errMsg: "collection is required when taskType is in need_collection_evts",
      }
    }

  }

  return null
}

// 有一个核心的逻辑: 提供一个上下文的 map 存储所有已查出来的数据和待更新的数据
// 这样队列里的操作，如果有获取重复的数据时，不需要查询多次了
// 更新时同理，若有更新一条数据多次时，只需要更新一次

async function toExecute(
  body: Record<string, any>,
  ssCtx: SyncSetCtx,
) {
  const results: SyncSetAtomRes[] = []
  const list = body.atoms as SyncSetAtom[]

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { taskType, taskId } = v
    const { thread, comment, member, workspace } = v

    let res1: SyncSetAtomRes | undefined
    if(taskType === "content-post") {
      if(thread) {
        res1 = await toPostThread(ssCtx, taskId, thread)
        if(res1) updateAtomsAfterPosting(list, res1, "content")
      }
      else if(comment) {
        await toPostComment(ssCtx, taskId, comment)
      }
    }
    else if(taskType === "thread-edit") {

    }
    else if(taskType === "thread-hourglass") {

    }

    if(!res1) {
      res1 = { code: "E5001", taskId, errMsg: "the taskType cannot match" }
    }
    results.push(res1)
  }

  return results
}


function updateAtomsAfterPosting(
  list: SyncSetAtom[],
  res: SyncSetAtomRes,
  whichType: "content" | "draft" | "collection",
) {
  const { first_id, new_id } = res
  const w = whichType
  if(!first_id || !new_id) return

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { thread, comment, draft, collection } = v

    // update thread's id
    if(thread && w === "content") {
      if(thread.first_id === first_id) {
        thread.id = new_id
      }
    }

    // update comment's id
    if(comment && w === "content") {
      if(comment.first_id === first_id) {
        comment.id = new_id
      }
      if(comment.parentThread === first_id) {
        comment.parentThread = new_id
      }
      if(comment.parentComment === first_id) {
        comment.parentComment = new_id
      }
      if(comment.replyToComment === first_id) {
        comment.replyToComment = new_id
      }
    }

    // update draft's id
    if(draft) {
      if(draft.first_id === first_id && w === "draft") {
        draft.id = new_id
      }
      if(draft.threadEdited === first_id && w === "content") {
        draft.threadEdited = new_id
      }
      if(draft.parentThread === first_id && w === "content") {
        draft.parentThread = new_id
      }
      if(draft.parentComment === first_id && w === "content") {
        draft.parentComment = new_id
      }
      if(draft.replyToComment === first_id && w === "content") {
        draft.replyToComment = new_id
      }
    }

    // update collection's id
    if(collection) {
      if(collection.first_id === first_id && w === "collection") {
        collection.id = new_id
      }
      if(collection.content_id === first_id && w === "content") {
        collection.content_id = first_id
      }
    }

  }

}


async function toPostThread(
  ssCtx: SyncSetCtx,
  taskId: string,
  thread: LiuUploadThread,
): Promise<SyncSetAtomRes> {

  // 1. get some important parameters
  const { spaceId, first_id } = thread
  const { _id: userId } = ssCtx.me
  if(!spaceId || !first_id) {
    return { code: "E4000", taskId, errMsg: "spaceId and first_id are required" }
  }

  // 2. check if the user is in the space
  const isInTheSpace = _amIInTheSpace(ssCtx, spaceId)
  if(!isInTheSpace) {
    return { code: "E4003", taskId, errMsg: "you are not in the workspace" }
  }

  // 3. inspect data technically
  const ostate_list: OState[] = ["OK", "REMOVED"]
  const Sch_PostThread = vbot.object({
    first_id: vbot.string([vbot.minLength(20)]),
    spaceId: vbot.string(),

    liuDesc: vbot.optional(vbot.array(vbot.any())),
    images: vbot.optional(vbot.array(Sch_Cloud_ImageStore)),
    files: vbot.optional(vbot.array(Sch_Cloud_FileStore)),

    editedStamp: vbot.optional(vbot.number()),
    oState: vbot.picklist(ostate_list),

    title: vbot.optional(vbot.string()),
    calendarStamp: vbot.optional(vbot.number()),
    remindStamp: vbot.optional(vbot.number()),
    whenStamp: vbot.optional(vbot.number()),
    remindMe: vbot.optional(Sch_LiuRemindMe),
    pinStamp: vbot.optional(vbot.number()),

    createdStamp: vbot.number(),

    tagIds: vbot.optional(vbot.array(vbot.string())),
    tagSearched: vbot.optional(vbot.array(vbot.string())),
    stateId: vbot.optional(vbot.string()),
    config: vbot.optional(Sch_ContentConfig),
  }, vbot.never())     // open strict mode
  const res3 = vbot.safeParse(Sch_PostThread, thread)
  if(!res3.success) {
    console.warn("inspecting data failed")
    console.log(res3)
    const err3 = checker.getErrMsgFromIssues(res3.issues)
    return { code: "E4000", taskId, errMsg: err3 }
  }

  // 4. inspect liuDesc and encrypt
  const { liuDesc } = thread
  const aesKey = getAESKey() ?? ""
  let enc_desc: CryptoCipherAndIV | undefined
  if(liuDesc) {
    const res4 = checker.isLiuContentArr(liuDesc)
    if(!res4) {
      return { code: "E4000", taskId, errMsg: "liuDesc is illegal" }
    }
    enc_desc = encryptDataWithAES(liuDesc, aesKey)
    console.log("看一下加密后的 liuDesc: ")
    console.log(enc_desc)
  }
  
  // 5. get memberId which is required
  // because it's posting a thread instead of comment
  const memberId = await getMyMemberId(ssCtx, userId, spaceId)
  if(!memberId) {
    return { 
      code: "E4003", taskId, 
      errMsg: "you do not have a memberId in the workspace", 
    }
  }

  // 6. get the workspace
  const workspace = await getData<Table_Workspace>(ssCtx, "workspace", spaceId)
  if(!workspace) {
    return { 
      code: "E4004", taskId,
      errMsg: "workspace not found",
    }
  }
  const spaceType = workspace.infoType

  // 7. construct a new row of Table_Content
  const { title, images, files } = thread
  const enc_title = encryptDataWithAES(title, aesKey)
  const enc_images = images?.length ? encryptDataWithAES(images, aesKey) : undefined
  const enc_files = files?.length ? encryptDataWithAES(files, aesKey) : undefined
  // TODO: enc_search_text

  const b6 = getBasicStampWhileAdding()
  const newRow: Partial<Table_Content> = {
    ...b6,
    first_id,
    user: userId,
    member: memberId,
    spaceId,
    spaceType,
    infoType: "THREAD",
    oState: thread.oState ?? "OK",
    visScope: "DEFAULT",
    storageState: "CLOUD", 
    enc_title,
    enc_desc,
    enc_images,
    enc_files,
    calendarStamp: thread.calendarStamp,
    remindStamp: thread.remindStamp,
    whenStamp: thread.whenStamp,
    remindMe: thread.remindMe,
    emojiData: { total: 0, system: [] },
    pinStamp: thread.pinStamp,
    createdStamp: thread.createdStamp,
    editedStamp: thread.editedStamp,
    tagIds: thread.tagIds,
    tagSearched: thread.tagSearched,
    stateId: thread.stateId,
    config: thread.config,
    levelOne: 0,
    levelOneAndTwo: 0,
  }

  const new_id = await insertData(ssCtx, "content", newRow)
  if(!new_id) {
    return { code: "E5001", taskId, errMsg: "insert data failed" }
  }

  return { code: "0000", taskId, first_id, new_id }
}

async function toPostComment(
  ssCtx: SyncSetCtx,
  taskId: string,
  comment: LiuUploadComment,
) {
  
}

function _amIInTheSpace(
  ssCtx: SyncSetCtx,
  spaceId: string,
) {
  const space_ids = ssCtx.space_ids
  return space_ids.includes(spaceId)
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





/***************** 跟数据库打交道，同时使用 ssCtx 来暂存已读取的数据 *************/

async function getMyMemberId(
  ssCtx: SyncSetCtx,
  userId: string,
  spaceId: string,
) {
  let memberId: string | undefined

  // 1. get memberId from ssCtx
  ssCtx.member.forEach((atom, id) => {
    const m = atom.data
    if(m.spaceId === spaceId && m.user === userId) {
      memberId = id
    }
  })
  if(memberId) return memberId

  // 2. get memberId from database
  const col = db.collection("Member")
  const q2 = col.where({ user: userId, spaceId })
  const res = await q2.get<Table_Member>()
  const list = res.data
  if(list.length < 1) return
  
  // 3. update ssCtx
  const m3 = list[0]
  memberId = m3._id
  ssCtx.member.set(memberId, { data: m3 })
  return memberId
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
  if(!d) return

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
