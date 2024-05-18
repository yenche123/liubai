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
  LiuUploadCollection,
  LiuUploadWorkspace,
  LiuUploadMember,
  LiuUploadDraft,
  SyncSetAtomRes,
  CryptoCipherAndIV,
  OState,
  Res_SyncSet_Cloud,
  SyncSetTable,
  Table_Collection,
  SpaceType,
  OState_Draft,
  TableName,
} from "@/common-types"
import { 
  Sch_Simple_SyncSetAtom,
  Sch_Cloud_ImageStore,
  Sch_Cloud_FileStore,
  Sch_ContentConfig,
  Sch_LiuRemindMe,
  Sch_OState_2,
  Sch_ContentInfoType,
  Sch_Cloud_StateConfig,
  Sch_TagView,
  Sch_Id,
  Sch_Opt_Str,
  Sch_Opt_Num,
  sch_opt_arr,
  Sch_OState_Draft,
  Sch_EmojiData,
} from "@/common-types"
import { 
  getNowStamp,
} from "@/common-time"
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

  // console.log("new body::")
  // console.log(res3.newBody)

  // 4. check body
  const res4 = checkBody(res3.newBody)
  if(res4) return res4

  // 5. to init ctx
  const ssCtx = initSyncSetCtx(user, workspaces)

  // 6. to execute
  const results = await toExecute(res3.newBody, ssCtx)

  // 7. construct response
  const res7: Res_SyncSet_Cloud = {
    results,
    plz_enc_results: results,
  }
  const encRes = getEncryptedData(res7, vRes)
  if(!encRes.data || encRes.rqReturn) {
    return encRes.rqReturn ?? { code: "E5001", errMsg: "getEncryptedData failed" }
  }
  
  return { code: "0000", data: encRes.data }
}


const need_thread_evts: LiuUploadTask[] = [
  "thread-post",
  "thread-edit",
  "thread-only_local",
  "thread-hourglass",
  "undo_thread-hourglass",
  "thread-when-remind",
  "undo_thread-when-remind",
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
  "comment-post",
  "comment-edit",
  "comment-delete",
]

const need_workspace_evts: LiuUploadTask[] = [
  "workspace-tag",
  "workspace-state_config",
  "undo_workspace-state_config",
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


function preCheck() {

  // 1. checking out the AES key of backend
  const backendAESKey = getAESKey()
  if(!backendAESKey) {
    return { code: "E5001", errMsg: "no backend AES key" }
  }

}



function checkBody(
  body: Record<string, any>,
): LiuRqReturn | null {

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

interface OperationOpt {
  taskId: string
  operateStamp: number
}

async function toExecute(
  body: Record<string, any>,
  ssCtx: SyncSetCtx,
) {
  const results: SyncSetAtomRes[] = []
  const list = body.atoms as SyncSetAtom[]

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { taskType, taskId, operateStamp } = v
    const opt: OperationOpt = { taskId, operateStamp }
    const { 
      thread, 
      comment, 
      member, 
      workspace, 
      collection,
      draft,
    } = v

    let res1: SyncSetAtomRes | undefined
    if(taskType === "thread-post" && thread) {
      res1 = await toPostThread(ssCtx, thread, opt)
      if(res1) updateAtomsAfterPosting(list, res1, "content")
    }
    else if(taskType === "comment-post" && comment) {
      res1 = await toPostComment(ssCtx, comment, opt)
      if(res1) updateAtomsAfterPosting(list, res1, "content")
    }
    else if(taskType === "thread-edit" && thread) {
      res1 = await toThreadEdit(ssCtx, thread, opt)
    }
    else if(taskType === "thread-only_local" && thread) {
      res1 = await toThreadOnlyLocal(ssCtx, thread, opt)
    }
    else if(taskType === "thread-hourglass" && thread) {
      res1 = await toThreadHourglass(ssCtx, thread, opt)
    }
    else if(taskType === "undo_thread-hourglass" && thread) {
      res1 = await toThreadHourglass(ssCtx, thread, opt)
    }
    else if(taskType === "thread-when-remind" && thread) {
      res1 = await toThreadWhenRemind(ssCtx, thread, opt)
    }
    else if(taskType === "undo_thread-when-remind" && thread) {
      res1 = await toThreadWhenRemind(ssCtx, thread, opt)
    }
    else if(taskType === "collection-favorite" && collection) {
      res1 = await toCollectionFavorite(ssCtx, collection, opt)
    }
    else if(taskType === "undo_collection-favorite" && collection) {
      res1 = await toCollectionFavorite(ssCtx, collection, opt)
    }
    else if(taskType === "collection-react" && collection) {
      res1 = await toCollectionReact(ssCtx, collection, opt)
    }
    else if(taskType === "undo_collection-react" && collection) {
      res1 = await toCollectionReact(ssCtx, collection, opt)
    }
    else if(taskType === "thread-delete" && thread) {
      res1 = await toThread_OState(ssCtx, thread, opt, "REMOVED")
    }
    else if(taskType === "undo_thread-delete" && thread) {
      res1 = await toThread_OState(ssCtx, thread, opt, "OK")
    }
    else if(taskType === "thread-state" && thread) {
      res1 = await toThreadState(ssCtx, thread, opt)
    }
    else if(taskType === "undo_thread-state" && thread) {
      res1 = await toThreadState(ssCtx, thread, opt)
    }
    else if(taskType === "thread-restore" && thread) {
      res1 = await toThread_OState(ssCtx, thread, opt, "OK")
    }
    else if(taskType === "thread-delete_forever" && thread) {
      res1 = await toThread_OState(ssCtx, thread, opt, "DELETED")
    }
    else if(taskType === "thread-pin" && thread) {
      res1 = await toThreadPin(ssCtx, thread, opt)
    }
    else if(taskType === "undo_thread-pin" && thread) {
      res1 = await toThreadPin(ssCtx, thread, opt)
    }
    else if(taskType === "thread-tag" && thread) {
      res1 = await toThreadTag(ssCtx, thread, opt)
    }
    else if(taskType === "comment-delete" && comment) {
      res1 = await toComment_OState(ssCtx, comment, opt, "DELETED")
    }
    else if(taskType === "comment-edit" && comment) {
      res1 = await toCommentEdit(ssCtx, comment, opt)
    }
    else if(taskType === "workspace-tag" && workspace) {
      res1 = await toWorkspaceTag(ssCtx, workspace, opt)
    }
    else if(taskType === "workspace-state_config" && workspace) {
      res1 = await toWorkspaceStateConfig(ssCtx, workspace, opt)
    }
    else if(taskType === "undo_workspace-state_config" && workspace) {
      res1 = await toWorkspaceStateConfig(ssCtx, workspace, opt)
    }
    else if(taskType === "member-avatar" && member) {
      res1 = await toMemberAvatar(ssCtx, member, opt)
    }
    else if(taskType === "member-nickname" && member) {
      res1 = await toMemberNickname(ssCtx, member, opt)
    }
    else if(taskType === "draft-set" && draft) {
      res1 = await toDraftSet(ssCtx, draft, opt)
    }
    else if(taskType === "draft-clear" && draft) {
      res1 = await toDraftClear(ssCtx, draft, opt)
    }

    if(!res1) {
      res1 = { code: "E5001", taskId, errMsg: "the taskType cannot match" }
    }
    results.push(res1)
  }

  await updateAllData(ssCtx)

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


/************************** Operation: Add a thread ************************/
async function toPostThread(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId } = opt

  // 1. inspect data technically
  const ostate_list: OState[] = ["OK", "REMOVED"]
  const Sch_PostThread = vbot.object({
    first_id: vbot.string([vbot.minLength(20)]),
    spaceId: vbot.string(),

    liuDesc: sch_opt_arr(vbot.any()),
    images: sch_opt_arr(Sch_Cloud_ImageStore),
    files: sch_opt_arr(Sch_Cloud_FileStore),

    editedStamp: vbot.number(),
    oState: vbot.picklist(ostate_list),

    title: Sch_Opt_Str,
    calendarStamp: Sch_Opt_Num,
    remindStamp: Sch_Opt_Num,
    whenStamp: Sch_Opt_Num,
    remindMe: vbot.optional(Sch_LiuRemindMe),
    pinStamp: Sch_Opt_Num,

    createdStamp: vbot.number(),

    tagIds: sch_opt_arr(vbot.string()),
    tagSearched: sch_opt_arr(vbot.string()),
    stateId: Sch_Opt_Str,

    emojiData: Sch_EmojiData,
    config: vbot.optional(Sch_ContentConfig),
  }, vbot.never())     // open strict mode
  const res1 = checkoutInput(Sch_PostThread, thread, taskId)
  if(res1) return res1

  // 2. get shared data
  const sharedData = await getSharedData_1(ssCtx, taskId, thread)
  if(!sharedData.pass) {
    return sharedData.result
  }
  const { 
    spaceId,
    first_id,
    userId,
    memberId,
    enc_desc,
    enc_images,
    enc_files,
  } = sharedData

  // 3. inspect liuDesc and encrypt
  const aesKey = getAESKey() ?? ""

  // 4. get the workspace
  const res4 = await getSharedData_8(ssCtx, spaceId, opt)
  if(!res4.pass) return res4.result
  const { spaceType } = res4

  // 5. construct a new row of Table_Content
  const { title } = thread
  const enc_title = encryptDataWithAES(title, aesKey)

  // 6. construct a new row of Table_Content
  const b6 = getBasicStampWhileAdding(ssCtx)
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
    emojiData: thread.emojiData,
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
    return { code: "E5001", taskId, errMsg: "inserting data failed" }
  }

  return { code: "0000", taskId, first_id, new_id }
}

/************************** Operation: Add a comment ************************/
async function toPostComment(
  ssCtx: SyncSetCtx,
  comment: LiuUploadComment,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId } = opt

  // 1. inspect data technically
  const Sch_PostComment = vbot.object({
    first_id: vbot.string([vbot.minLength(20)]),
    spaceId: vbot.string(),

    liuDesc: sch_opt_arr(vbot.any()),
    images: sch_opt_arr(Sch_Cloud_ImageStore),
    files: sch_opt_arr(Sch_Cloud_FileStore),
    
    editedStamp: vbot.number(),

    parentThread: Sch_Opt_Str,
    parentComment: Sch_Opt_Str,
    replyToComment: Sch_Opt_Str,
    createdStamp: vbot.number(),

    emojiData: Sch_EmojiData,
  }, vbot.never())
  const res1 = checkoutInput(Sch_PostComment, comment, taskId)
  if(res1) return res1

  // 2. get shared data
  const sharedData = await getSharedData_1(ssCtx, taskId, comment)
  if(!sharedData.pass) {
    return sharedData.result
  }

  const {
    spaceId, 
    first_id, 
    userId, 
    memberId, 
    enc_desc, 
    enc_images, 
    enc_files, 
  } = sharedData

  // 3. get the workspace
  const res3 = await getSharedData_8(ssCtx, spaceId, opt)
  if(!res3.pass) return res3.result
  const { spaceType } = res3

  // 4. construct a new row of Table_Content
  const b4 = getBasicStampWhileAdding(ssCtx)
  const newRow: Partial<Table_Content> = {
    ...b4,
    first_id,
    user: userId,
    member: memberId,
    spaceId,
    spaceType,
    infoType: "COMMENT",
    oState: "OK",
    visScope: "DEFAULT",
    storageState: "CLOUD",
    enc_desc,
    enc_images,
    enc_files,
    emojiData: comment.emojiData,
    createdStamp: comment.createdStamp,
    editedStamp: comment.editedStamp,
    parentThread: comment.parentThread,
    parentComment: comment.parentComment,
    replyToComment: comment.replyToComment,
    levelOne: 0,
    levelOneAndTwo: 0,
  }

  const new_id = await insertData(ssCtx, "content", newRow)
  if(!new_id) {
    return { 
      code: "E5001", taskId, 
      errMsg: "inserting data failed",
    }
  }

  return { code: "0000", taskId, first_id, new_id }
}

/************************** Operation: Edit a thread ************************/
async function toThreadEdit(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId } = opt

  // 1. inspect data technically
  const Sch_EditThread = vbot.object({
    id: Sch_Id,
    first_id: Sch_Opt_Str,

    liuDesc: sch_opt_arr(vbot.any()),
    images: sch_opt_arr(Sch_Cloud_ImageStore),
    files: sch_opt_arr(Sch_Cloud_FileStore),

    editedStamp: vbot.number(),
    title: Sch_Opt_Str,
    calendarStamp: Sch_Opt_Num,
    remindStamp: Sch_Opt_Num,
    whenStamp: Sch_Opt_Num,
    remindMe: vbot.optional(Sch_LiuRemindMe),

    tagIds: sch_opt_arr(vbot.string()),
    tagSearched: sch_opt_arr(vbot.string()),
  }, vbot.never())
  const res1 = checkoutInput(Sch_EditThread, thread, taskId)
  if(res1) return res1

  // 2. find the thread
  const sharedData = await getSharedData_2(ssCtx, taskId, thread)
  if(!sharedData.pass) return sharedData.result
  
  // 3. enc_title
  const { title } = thread
  const aesKey = getAESKey() ?? ""
  const enc_title = encryptDataWithAES(title, aesKey)

  // 4. construct a new row of Table_Content
  const new_data: Partial<Table_Content> = {
    enc_title,
    enc_desc: sharedData.enc_desc,
    enc_images: sharedData.enc_images,
    enc_files: sharedData.enc_files,
    calendarStamp: thread.calendarStamp,
    remindStamp: thread.remindStamp,
    whenStamp: thread.whenStamp,
    remindMe: thread.remindMe,
    editedStamp: thread.editedStamp,
    tagIds: thread.tagIds,
    tagSearched: thread.tagSearched,
  }
  await updatePartData(ssCtx, "content", sharedData.content_id, new_data)
  return { code: "0000", taskId }
}

/********************* Operation: only local ********************/
async function toThreadOnlyLocal(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
) {
  const { taskId } = opt

  // 1. inspect data technically
  const Sch_OnlyLocal = vbot.object({
    id: Sch_Id,
  }, vbot.never())
  const res = checkoutInput(Sch_OnlyLocal, thread, taskId)
  if(res) return res

  // 2. find the thread & check permission
  const res2 = await getSharedData_3(ssCtx, taskId, thread)
  if(!res2.pass) return res2.result

  // 3. check storageState out
  const { content_id: id, oldContent } = res2
  if(oldContent.storageState === "ONLY_LOCAL") {
    return { code: "0001", taskId }
  }

  const u: Partial<Table_Content> = {
    storageState: "ONLY_LOCAL",
    enc_title: undefined,
    enc_desc: undefined,
    enc_images: undefined,
    enc_files: undefined,
    enc_search_text: undefined,
  }
  await updatePartData(ssCtx, "content", id, u)
  return { code: "0000", taskId }
}

/********************* Operation: Edit hourglass / showCountdown ********************/
async function toThreadHourglass(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId, operateStamp } = opt

  // 1. inspect data technically
  const Sch_Hourglass = vbot.object({
    id: Sch_Id,
    first_id: Sch_Opt_Str,
    showCountdown: vbot.boolean(),
  }, vbot.never())
  const res1 = checkoutInput(Sch_Hourglass, thread, taskId)
  if(res1) return res1

  // 2. find the thread & check permission
  const res2 = await getSharedData_3(ssCtx, taskId, thread)
  if(!res2.pass) return res2.result

  // 3. check if operateStamp is greater than lastToggleCountdown
  const { content_id: id, oldContent } = res2
  const cfg = oldContent.config ?? {}
  const stamp = cfg.lastToggleCountdown ?? 1
  if(stamp >= operateStamp) {
    return { code: "0002", taskId }
  }

  cfg.showCountdown = thread.showCountdown as boolean
  cfg.lastToggleCountdown = operateStamp

  await updatePartData<Table_Content>(ssCtx, "content", id, { config: cfg })

  return { code: "0000", taskId }
}

/********************* Operation: Edit when or remind ********************/
async function toThreadWhenRemind(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId, operateStamp } = opt

  // 1. inspect data technically
  const Sch_Hourglass = vbot.object({
    id: Sch_Id,
    first_id: Sch_Opt_Str,
    whenStamp: Sch_Opt_Num,
    remindStamp: Sch_Opt_Num,
    remindMe: vbot.optional(Sch_LiuRemindMe),
  }, vbot.never())
  const res1 = checkoutInput(Sch_Hourglass, thread, taskId)
  if(res1) return res1

  // 2. find the thread & check permission
  const res2 = await getSharedData_3(ssCtx, taskId, thread)
  if(!res2.pass) return res2.result

  // 3. check if operateStamp is greater than lastOperateWhenRemind
  const { content_id: id, oldContent } = res2
  const cfg = oldContent.config ?? {}
  const stamp = cfg.lastOperateWhenRemind ?? 1
  if(stamp >= operateStamp) {
    return { code: "0002", taskId }
  }

  // 4. update
  cfg.lastOperateWhenRemind = operateStamp
  const u: Partial<Table_Content> = {
    whenStamp: thread.whenStamp,
    remindStamp: thread.remindStamp,
    remindMe: thread.remindMe,
    config: cfg
  }
  await updatePartData(ssCtx, "content", id, u)
  return { code: "0000", taskId }
}

/********************* Operation: favorite ********************/
async function toCollectionFavorite(
  ssCtx: SyncSetCtx,
  collection: LiuUploadCollection,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId, operateStamp } = opt

  // 1. inspect data technically
  const Sch_Favorite = vbot.object({
    id: vbot.optional(Sch_Id),
    first_id: Sch_Id,
    oState: Sch_OState_2,
    content_id: Sch_Id,
  }, vbot.never())
  const res1 = checkoutInput(Sch_Favorite, collection, taskId)
  if(res1) return res1

  // 2. if collection.id exists
  const { id, first_id } = collection
  const newOState = collection.oState
  if(id && id !== first_id) {
    const res2 = await getSharedData_4(ssCtx, taskId, id)
    if(!res2.pass) return res2.result
    const { oldCollection } = res2
    if(oldCollection.oState === newOState) {
      return { code: "0001", taskId }
    }
    const oldStamp = oldCollection.operateStamp ?? 1
    if(oldStamp >= operateStamp) {
      return { code: "0002", taskId }
    }

    const u = { oState: newOState, operateStamp }
    await updatePartData<Table_Collection>(ssCtx, "collection", id, u)
    return { code: "0000", taskId }
  }

  // 3. handle shared logic
  const res3 = await toCollectionShared(ssCtx, collection, opt, "FAVORITE")
  return res3
}

/********************* Operation: add or delete emoji ********************/
async function toCollectionReact(
  ssCtx: SyncSetCtx,
  collection: LiuUploadCollection,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId } = opt

  // 1. inspect data technically
  const Sch_React = vbot.object({
    id: vbot.optional(Sch_Id),
    first_id: Sch_Id,
    oState: Sch_OState_2,
    content_id: Sch_Id,
    emoji: vbot.string(), // 存储 emoji 的 encodeURIComponent()
  }, vbot.never())
  const res1 = checkoutInput(Sch_React, collection, taskId)
  if(res1) return res1

  // 2. if collection.id exists
  const { id, first_id } = collection
  if(id && id !== first_id) {
    const res2 = await toCollectionReactWithId(ssCtx, collection, opt)
    return res2
  }

  // 3. handle shared logic
  const res3 = await toCollectionShared(ssCtx, collection, opt, "EXPRESS")
  return res3
}

// to edit collection for reaction
async function toCollectionReactWithId(
  ssCtx: SyncSetCtx,
  collection: LiuUploadCollection,
  opt: OperationOpt,
) {
  const { taskId, operateStamp } = opt
  const id = collection.id as string
  const newOState = collection.oState
  const newEmoji = collection.emoji as string

  // 1. get old collection
  const res1 = await getSharedData_4(ssCtx, taskId, id)
  if(!res1.pass) return res1.result
  const { oldCollection } = res1
  const oldEmoji = oldCollection.emoji
  const oldOState = oldCollection.oState
  const parentId = oldCollection.content_id
  if(oldEmoji === newEmoji && oldOState === newOState) {
    return { code: "0001", taskId }
  }
  const oldStamp = oldCollection.operateStamp ?? 1
  if(oldStamp >= operateStamp) {
    return { code: "0002", taskId }
  }

  // 2. minus 1 from old content if old emoji is OK
  if(oldOState === "OK" && oldEmoji) {
    await updateParentEmojiData(ssCtx, parentId, oldEmoji, operateStamp, -1)
  }

  // 3. update new emoji in collection
  const u = {
    oState: newOState,
    emoji: newEmoji,
    operateStamp,
  }
  await updatePartData<Table_Collection>(ssCtx, "collection", id, u)

  // 4. add 1 to emojiData if new emoji is OK
  if(newOState === "OK" && newEmoji) {
    await updateParentEmojiData(ssCtx, parentId, newEmoji, operateStamp, 1)
  }

  return { code: "0000", taskId }
}


// shared logic if conllection.id doesn't exist in
// toCollectionFavorite & toCollectionReact
async function toCollectionShared(
  ssCtx: SyncSetCtx,
  collection: LiuUploadCollection,
  opt: OperationOpt,
  infoType: "EXPRESS" | "FAVORITE",
): Promise<SyncSetAtomRes> {
  const { taskId, operateStamp } = opt
  const { first_id, content_id, emoji } = collection

  // 1. get shared data
  const res1 = await getSharedData_5(ssCtx, taskId, content_id)
  if(!res1.pass) return res1.result
  const { infoType: forType, spaceId, spaceType } = res1.oldContent
  
  // 2. construct a new row of Table_Collection
  const b4 = getBasicStampWhileAdding(ssCtx)
  const newRow: Partial<Table_Collection> = {
    ...b4,
    first_id,
    oState: collection.oState,
    user: res1.userId,
    member: res1.memberId,
    infoType,
    forType,
    spaceId,
    spaceType,
    content_id,
    operateStamp,
    emoji,
  }
  const new_id = await insertData(ssCtx, "collection", newRow)
  if(!new_id) {
    return { code: "E5001", taskId, errMsg: "inserting data failed" }
  }

  if(infoType === "EXPRESS" && emoji) {
    await updateParentEmojiData(ssCtx, content_id, emoji, operateStamp, 1)
  }

  return { code: "0000", taskId, first_id, new_id }
}


// update parent content's emojiData
async function updateParentEmojiData(
  ssCtx: SyncSetCtx,
  contentId: string,
  encodeStr: string,
  stamp: number,
  delta: number = 1,
) {
  const content = await getData<Table_Content>(ssCtx, "content", contentId)
  if(!content) return false
  const { emojiData, config: cfg = {} } = content
  emojiData.total += delta
  if(emojiData.total < 0) emojiData.total = 0
  const emojiSystem = emojiData.system
  const theEmoji = emojiSystem.find(v => v.encodeStr === encodeStr)
  if(theEmoji) {
    theEmoji.num += delta
    if(theEmoji.num < 0) theEmoji.num = 0
  }
  else if(delta > 0) {
    emojiSystem.push({ num: delta, encodeStr })
  }

  const oldStamp = cfg.lastUpdateEmojiData ?? 1
  if(oldStamp > stamp) {
    stamp = oldStamp + 1
  }

  cfg.lastUpdateEmojiData = stamp
  emojiData.system = emojiSystem
  const u: Partial<Table_Content> = { emojiData, config: cfg }
  await updatePartData(ssCtx, "content", contentId, u)
  return true
}


/***************** Operation: operate oState of a thread *************/
async function toThread_OState(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
  newOState: OState,
) {
  const res1 = await getSharedData_6(ssCtx, thread, opt, newOState)
  return res1.result
}

/***************** Operation: set a state of a thread (including undo) ***********/
async function toThreadState(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId, operateStamp } = opt

  // 1. inspect data technically
  const Sch_State = vbot.object({
    id: Sch_Id,
    first_id: Sch_Opt_Str,
    stateId: Sch_Opt_Str,
  }, vbot.never())
  const res1 = checkoutInput(Sch_State, thread, taskId)
  if(res1) return res1

  // 2. get shared data
  const res2 = await getSharedData_3(ssCtx, taskId, thread)
  if(!res2.pass) return res2.result
  const { oldContent } = res2

  //  3. check out every data
  const id = thread.id as string
  const stateId = thread.stateId
  if(oldContent.stateId === stateId) {
    return { code: "0001", taskId }
  }
  const { config: cfg = {} } = oldContent
  const oldStamp = cfg.lastOperateStateId ?? 1
  if(oldStamp >= operateStamp) {
    return { code: "0002", taskId }
  }
  
  // 4. update data
  cfg.lastOperateStateId = operateStamp
  const u: Partial<Table_Content> = {
    stateId,
    config: cfg,
  }
  await updatePartData(ssCtx, "content", id, u)
  return { code: "0000", taskId }
}

/***************** Operation: pin a thread (including undo) ***********/
async function toThreadPin(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId, operateStamp } = opt

  // 1. inspect data technically
  const Sch_Pin = vbot.object({
    id: Sch_Id,
    first_id: Sch_Opt_Str,
    pinStamp: Sch_Opt_Num,
  }, vbot.never())
  const res1 = checkoutInput(Sch_Pin, thread, taskId)
  if(res1) return res1

  // 2. get shared data
  const res2 = await getSharedData_3(ssCtx, taskId, thread)
  if(!res2.pass) return res2.result
  const { oldContent } = res2

  // 3. check out every data
  const id = thread.id as string
  const { pinStamp, config: cfg = {} } = thread
  if(oldContent.pinStamp === pinStamp) {
    return { code: "0001", taskId }
  }
  const lastStamp = cfg.lastOperatePin ?? 1
  if(lastStamp >= operateStamp) {
    return { code: "0002", taskId }
  }

  cfg.lastOperatePin = operateStamp
  const u: Partial<Table_Content> = {
    pinStamp,
    config: cfg,
  }
  await updatePartData(ssCtx, "content", id, u)
  return { code: "0000", taskId }
}

/***************** Operation: edit tags of a thread ***********/
async function toThreadTag(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId, operateStamp } = opt
  // 1. inspect data technically
  const Sch_Tag = vbot.object({
    id: Sch_Id,
    first_id: Sch_Opt_Str,
    tagIds: sch_opt_arr(vbot.string()),
    tagSearched: sch_opt_arr(vbot.string()),
  }, vbot.never())
  const res = checkoutInput(Sch_Tag, thread, taskId)
  if(res) return res

  // 2. get shared data
  const res2 = await getSharedData_3(ssCtx, taskId, thread)
  if(!res2.pass) return res2.result
  const { oldContent } = res2

  const id = thread.id as string
  const { tagIds, tagSearched } = thread
  const { config: cfg = {} } = oldContent
  const lastStamp = cfg.lastOperateTag ?? 1
  if(lastStamp >= operateStamp) {
    return { code: "0002", taskId }
  }

  // 3. update data
  cfg.lastOperateTag = operateStamp
  const u: Partial<Table_Content> = {
    tagIds,
    tagSearched,
    config: cfg,
  }
  await updatePartData(ssCtx, "content", id, u)

  return { code: "0000", taskId } 
}

/***************** Operation: update comment's oState ***********/
async function toComment_OState(
  ssCtx: SyncSetCtx,
  comment: LiuUploadComment,
  opt: OperationOpt,
  newOState: OState,
): Promise<SyncSetAtomRes> {
  // 1. change comment's oState using getSharedData_6
  const res1 = await getSharedData_6(ssCtx, comment, opt, newOState)
  const pass = res1.pass
  const code = res1.result.code
  if(!pass || code !== "0000") return res1.result
  if(newOState !== "DELETED") return res1.result

  // 2. update parent's levelOne and levelOneAndTwo
  const { oldContent } = res1
  const { parentThread, parentComment, replyToComment } = oldContent
  
  if(parentThread && !parentComment && !replyToComment) {
    await _deleteCommentNum(ssCtx, parentThread)
    return res1.result
  }

  if(replyToComment) {
    await _deleteCommentNum(ssCtx, replyToComment)
  }

  if(parentComment) {
    if(parentComment !== replyToComment) {
      await _deleteCommentNum(ssCtx, parentComment, 0, 1)
    }
    else if(parentThread) {
      await _deleteCommentNum(ssCtx, parentThread, 0, 1)
    }
  }

  return res1.result
}

// minus one from levelOne or levelTwo of a content
async function _deleteCommentNum(
  ssCtx: SyncSetCtx,
  id: string,
  levelOne: number = 1,
  levelOneAndTwo: number = 1,
) {
  const res = await getData<Table_Content>(ssCtx, "content", id)
  if(!res) return false
  
  let num1 = valTool.minusAndMinimumZero(res.levelOne, levelOne)
  let num2 = valTool.minusAndMinimumZero(res.levelOneAndTwo, levelOneAndTwo)
  const u: Partial<Table_Content> = {
    levelOne: num1,
    levelOneAndTwo: num2,
  }
  await updatePartData(ssCtx, "content", id, u)
  return true
}


/***************** Operation: edit a comment ***********/
async function toCommentEdit(
  ssCtx: SyncSetCtx,
  comment: LiuUploadComment,
  opt: OperationOpt,
) {
  const { taskId } = opt
  const Sch_EditComment = vbot.object({
    id: Sch_Id,
    first_id: Sch_Opt_Str,

    liuDesc: sch_opt_arr(vbot.any()),
    images: sch_opt_arr(Sch_Cloud_ImageStore),
    files: sch_opt_arr(Sch_Cloud_FileStore),
    
    editedStamp: vbot.number(),
  }, vbot.never())
  const res = checkoutInput(Sch_EditComment, comment, taskId)
  if(res) return res

  const sharedData = await getSharedData_2(ssCtx, taskId, comment)
  if(!sharedData.pass) return sharedData.result

  const u: Partial<Table_Content> = {
    enc_desc: sharedData.enc_desc,
    enc_images: sharedData.enc_images,
    enc_files: sharedData.enc_files,
    editedStamp: comment.editedStamp,
  }
  const id = sharedData.content_id
  await updatePartData(ssCtx, "content", id, u)
  return { code: "0000", taskId }
}

/***************** Operation: update workspace's tag ***********/
async function toWorkspaceTag(
  ssCtx: SyncSetCtx,
  workspace: LiuUploadWorkspace,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId, operateStamp } = opt

  // 1. inspect data technically
  const Sch_WorkspaceTag = vbot.object({
    id: Sch_Id,
    tagList: sch_opt_arr(Sch_TagView),
  }, vbot.never())
  const res1 = checkoutInput(Sch_WorkspaceTag, workspace, taskId)
  if(res1) return res1

  // 2. check permission
  const id = workspace.id
  const res2 = _amIInTheSpace(ssCtx, id)
  if(!res2) return { code: "E4003", taskId, errMsg: "no permission of the workspace" }

  // 3. get workspace
  const oldSpace = await getData<Table_Workspace>(ssCtx, "workspace", id)
  if(!oldSpace) return { code: "E4004", taskId, errMsg: "the workspace cannot be found" }

  // 4. check conflict
  const cfg = oldSpace.config ?? {}
  const oldStamp = cfg.lastOperateTag ?? 1
  if(oldStamp >= operateStamp) {
    return { code: "0002", taskId }
  }

  // 5. update
  cfg.lastOperateTag = operateStamp
  const u: Partial<Table_Workspace> = {
    tagList: workspace.tagList,
    config: cfg,
  }
  await updatePartData(ssCtx, "workspace", id, u)
  return { code: "0000", taskId }
}

/*********** Operation: update workspace's state_config ****/
async function toWorkspaceStateConfig(
  ssCtx: SyncSetCtx,
  workspace: LiuUploadWorkspace,
  opt: OperationOpt,
) {
  const { taskId } = opt

  // 1. inspect data technically
  const Sch_WorkspaceStateConfig = vbot.object({
    id: Sch_Id,
    stateConfig: Sch_Cloud_StateConfig,
  }, vbot.never())
  const res1 = checkoutInput(Sch_WorkspaceStateConfig, workspace, taskId)
  if(res1) return res1

  // 2. check permission
  const id = workspace.id
  const res2 = _amIInTheSpace(ssCtx, id)
  if(!res2) return { code: "E4003", taskId, errMsg: "no permission of the workspace" }

  // 3. get workspace
  const oldSpace = await getData<Table_Workspace>(ssCtx, "workspace", id)
  if(!oldSpace) return { code: "E4004", taskId, errMsg: "the workspace cannot be found" }

  // 4. check conflict
  const newStamp = workspace?.stateConfig?.updatedStamp as number
  const oldStamp = oldSpace?.stateConfig?.updatedStamp ?? 1
  if(oldStamp >= newStamp) {
    return { code: "0002", taskId }
  }

  // 5. update
  const u: Partial<Table_Workspace> = {
    stateConfig: workspace.stateConfig,
  }
  await updatePartData(ssCtx, "workspace", id, u)
  return { code: "0000", taskId }
}

/*********** Operation: update member's avatar ****/
async function toMemberAvatar(
  ssCtx: SyncSetCtx,
  member: LiuUploadMember,
  opt: OperationOpt,
) {
  const { taskId } = opt

  // 1. inspect data technically
  const Sch_Ma = vbot.object({
    id: Sch_Id,
    avatar: vbot.optional(Sch_Cloud_ImageStore),
  }, vbot.never())
  const res = checkoutInput(Sch_Ma, member, taskId)
  if(res) return res

  // 2. check permission
  const res2 = await getSharedData_7(ssCtx, member, opt)
  if(!res2.pass) return res2.result

  // 3. update
  const u: Partial<Table_Member> = {
    avatar: member.avatar,
  }
  const memberId = member.id
  await updatePartData(ssCtx, "member", memberId, u)
  return { code: "0000", taskId }
}

/*********** Operation: update member's nickname ****/
async function toMemberNickname(
  ssCtx: SyncSetCtx,
  member: LiuUploadMember,
  opt: OperationOpt,
) {
  const { taskId, operateStamp } = opt

  // 1. inspect data technically
  const Sch_Mn = vbot.object({
    id: Sch_Id,
    name: Sch_Opt_Str,
  },vbot.never())
  const res = checkoutInput(Sch_Mn, member, taskId)
  if(res) return res

  // 2. check permission
  const res2 = await getSharedData_7(ssCtx, member, opt)
  if(!res2.pass) return res2.result

  // 3. check out the conflict
  const cfg = res2.oldMember.config ?? {}
  const oldStamp = cfg.lastOperateName ?? 1
  if(oldStamp >= operateStamp) {
    return { code: "0002", taskId }
  }
  
  // 4. update
  const u: Partial<Table_Member> = {
    name: member.name,
  }
  const memberId = member.id
  await updatePartData(ssCtx, "member", memberId, u)
  return { code: "0000", taskId }
  
}

/*********** Operation: set draft ****/
async function toDraftSet(
  ssCtx: SyncSetCtx,
  draft: LiuUploadDraft,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId } = opt

  // 1. inspect data technically
  const Sch_DraftSet = vbot.object({
    id: vbot.optional(Sch_Id),
    first_id: vbot.optional(Sch_Id),
    spaceId: vbot.optional(Sch_Id),

    liuDesc: sch_opt_arr(vbot.any()),
    images: sch_opt_arr(Sch_Cloud_ImageStore),
    files: sch_opt_arr(Sch_Cloud_FileStore),

    editedStamp: vbot.number(),
    infoType: vbot.optional(Sch_ContentInfoType),

    threadEdited: Sch_Opt_Str,
    commentEdited: Sch_Opt_Str,
    parentThread: Sch_Opt_Str,
    parentComment: Sch_Opt_Str,
    replyToComment: Sch_Opt_Str,

    title: Sch_Opt_Str,
    whenStamp: Sch_Opt_Num,
    remindMe: vbot.optional(Sch_LiuRemindMe),
    tagIds: sch_opt_arr(Sch_Id),
  }, vbot.never())
  const res1 = checkoutInput(Sch_DraftSet, draft, taskId)
  if(res1) return res1

  // 2. inspect more
  const { id, first_id } = draft
  if(!id && !first_id) {
    return { code: "E4000", errMsg: "id or first is required", taskId }
  }

  // 3. if the operation is creating draft
  if(!id || id === first_id) {
    const Sch_DraftCreate = vbot.object({
      first_id: Sch_Id,
      spaceId: Sch_Id,
      infoType: Sch_ContentInfoType,
    })
    const res3 = checkoutInput(Sch_DraftCreate, draft, taskId)
    if(res3) return res3
    const res3_2 = await toDraftCreate(ssCtx, draft, opt)
    return res3_2
  }

  // 4. otherwise the operation is editing draft
  const res4 = await toDraftEdit(ssCtx, draft, opt)
  return res4
}


// to edit a draft
async function toDraftEdit(
  ssCtx: SyncSetCtx,
  draft: LiuUploadDraft,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId } = opt

  // 1. get the old draft
  const draft_id = draft.id as string
  const oldDraft = await getData<Table_Draft>(ssCtx, "draft", draft_id)
  if(!oldDraft) {
    return { code: "E4004", errMsg: "draft not found", taskId  }
  }

  // 2. check out permission to edit the draft
  const userId = ssCtx.me._id
  const oState = oldDraft.oState
  if(oldDraft.user !== userId) {
    return { code: "E4003", errMsg: "no permission to edit the draft", taskId }
  }
  if(oState === "POSTED") {
    return { code: "E4003", errMsg: "draft has been posted", taskId }
  }
  if(oState === "DELETED") {
    return { code: "E4003", errMsg: "draft has been deleted", taskId }
  }

  const oldStamp = oldDraft.editedStamp
  const editedStamp = draft.editedStamp as number
  if(oldStamp >= editedStamp) {
    return { code: "0002", taskId }
  }

  // 3. encrypt
  const res3 = await getSharedData_9(ssCtx, draft, opt)
  if(!res3.pass) return res3.result

  // 4. update
  const u: Partial<Table_Draft> = {
    oState: "OK",
    enc_title: res3.enc_title,
    enc_desc: res3.enc_desc,
    enc_images: res3.enc_images,
    enc_files: res3.enc_files,
    whenStamp: draft.whenStamp,
    remindMe: draft.remindMe,
    tagIds: draft.tagIds,
    editedStamp,
  }
  await updatePartData(ssCtx, "draft", draft_id, u)
  return { code: "0000", taskId }
}

// to create a draft
async function toDraftCreate(
  ssCtx: SyncSetCtx,
  draft: LiuUploadDraft,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId } = opt

  // 1. check out permission to edit the content
  let theId = draft.threadEdited ?? draft.commentEdited
  if(theId) {
    const content = await getData<Table_Content>(ssCtx, "content", theId)
    if(!content) {
      return { code: "E4004", errMsg: "content not found", taskId  }
    }
    const res1 = canIEditTheContent(ssCtx, content)
    if(!res1) {
      return { code: "E4003", errMsg: "permission denied", taskId }
    }
  }

  // 2. get spaceType
  const spaceId = draft.spaceId as string
  const res2 = await getSharedData_8(ssCtx, spaceId, opt)
  if(!res2.pass) return res2.result
  const { spaceType } = res2

  // 3. encrypt
  const res3 = await getSharedData_9(ssCtx, draft, opt)
  if(!res3.pass) return res3.result

  // 4. create
  const userId = ssCtx.me._id
  const first_id = draft.first_id as string
  const b4 = getBasicStampWhileAdding(ssCtx)
  const u: Partial<Table_Draft> = {
    ...b4,
    first_id,
    infoType: draft.infoType,
    oState: "OK",
    user: userId,
    spaceId,
    spaceType,

    threadEdited: draft.threadEdited,
    commentEdited: draft.commentEdited,
    parentThread: draft.parentThread,
    parentComment: draft.parentComment,
    replyToComment: draft.replyToComment,

    enc_title: res3.enc_title,
    enc_desc: res3.enc_desc,
    enc_images: res3.enc_images,
    enc_files: res3.enc_files,
    
    whenStamp: draft.whenStamp,
    remindMe: draft.remindMe,
    tagIds: draft.tagIds,
    editedStamp: draft.editedStamp,
  }
  const new_id = await insertData(ssCtx, "draft", u)
  if(!new_id) {
    return { code: "E5001", taskId, errMsg: "inserting data failed" }
  }

  return { code: "0000", taskId, first_id, new_id }
}


/*********** Operation: clear draft ****/
async function toDraftClear(
  ssCtx: SyncSetCtx,
  draft: LiuUploadDraft,
  opt: OperationOpt,
) {
  const { taskId, operateStamp } = opt
  const Sch_DraftClear = vbot.object({
    id: Sch_Id,
    oState: Sch_OState_Draft,
  }, vbot.never())
  const res1 = checkoutInput(Sch_DraftClear, draft, taskId)
  if(res1) return res1

  // 0. check out draft.oState
  const newOState = draft.oState as OState_Draft
  if(newOState === "OK") {
    return { code: "E4000", errMsg: "oState cannot be OK", taskId }
  }
  
  // 1. get the old draft
  const draft_id = draft.id as string
  const oldDraft = await getData<Table_Draft>(ssCtx, "draft", draft_id)
  if(!oldDraft) {
    return { code: "E4004", errMsg: "draft not found", taskId  }
  }

  // 2. check out permission to edit the draft
  const userId = ssCtx.me._id
  const oState = oldDraft.oState
  if(oldDraft.user !== userId) {
    return { code: "E4003", errMsg: "no permission to edit the draft", taskId }
  }
  if(oState === newOState) {
    return { code: "0001", taskId }
  }

  // 3. update
  const u: Partial<Table_Draft> = {
    oState: newOState,
    enc_title: undefined,
    enc_desc: undefined,
    enc_images: undefined,
    enc_files: undefined,
    editedStamp: operateStamp,
  }
  await updatePartData(ssCtx, "draft", draft_id, u)
  return { code: "0000", taskId }
}



/***************************** helper functions ************************ */

function canIEditTheContent(
  ssCtx: SyncSetCtx,
  content: Table_Content,
) {
  const { oState, infoType } = content
  if(oState === "DELETED") return false
  if(infoType === "COMMENT" && oState === "REMOVED") return false

  const userId = ssCtx.me._id
  if(content.user === userId) return true
  if(infoType === "COMMENT") return false
  const res = _amIInTheSpace(ssCtx, content.spaceId)
  return res
}

function checkoutInput<T extends vbot.BaseSchema>(
  sch: T,
  val: any,
  taskId: string,
): SyncSetAtomRes | undefined {
  const res = vbot.safeParse(sch, val)
  if(!res.success) {
    const err1 = checker.getErrMsgFromIssues(res.issues)
    return { code: "E4000", taskId, errMsg: err1 }
  }
}

interface Gsdr_A {
  pass: false
  result: SyncSetAtomRes
}

interface Gsdr_1_B {
  pass: true
  spaceId: string
  first_id: string
  userId: string
  memberId: string
  enc_desc?: CryptoCipherAndIV
  enc_images?: CryptoCipherAndIV
  enc_files?: CryptoCipherAndIV
}

interface Gsdr_2_B {
  pass: true
  content_id: string
  oldContent: Table_Content
  enc_desc?: CryptoCipherAndIV
  enc_images?: CryptoCipherAndIV
  enc_files?: CryptoCipherAndIV
}

interface Gsdr_3_B {
  pass: true
  content_id: string
  oldContent: Table_Content
}

interface Gsdr_4_B {
  pass: true
  oldCollection: Table_Collection
}

interface Gsdr_5_B {
  pass: true
  oldContent: Table_Content
  userId: string
  memberId?: string
}

interface Gsdr_6_B {
  pass: true
  result: SyncSetAtomRes
  oldContent: Table_Content
}

interface Gsdr_7_B {
  pass: true
  oldMember: Table_Member
}

interface Gsdr_8_B {
  pass: true
  spaceType: SpaceType
}

interface Gsdr_9_B {
  pass: true
  enc_title?: CryptoCipherAndIV
  enc_desc?: CryptoCipherAndIV
  enc_images?: CryptoCipherAndIV
  enc_files?: CryptoCipherAndIV
}

type GetShareDataRes_1 = Gsdr_A | Gsdr_1_B
type GetShareDataRes_2 = Gsdr_A | Gsdr_2_B
type GetShareDataRes_3 = Gsdr_A | Gsdr_3_B
type GetShareDataRes_4 = Gsdr_A | Gsdr_4_B
type GetShareDataRes_5 = Gsdr_A | Gsdr_5_B
type GetShareDataRes_6 = Gsdr_A | Gsdr_6_B
type GetShareDataRes_7 = Gsdr_A | Gsdr_7_B
type GetShareDataRes_8 = Gsdr_A | Gsdr_8_B
type GetShareDataRes_9 = Gsdr_A | Gsdr_9_B

// to encrypt draft
async function getSharedData_9(
  ssCtx: SyncSetCtx,
  draft: LiuUploadDraft,
  opt: OperationOpt,
): Promise<GetShareDataRes_9> {
  const { taskId } = opt
  const { title, liuDesc, images, files } = draft
  
  const aesKey = getAESKey() ?? ""

  // 1. handle desc
  let enc_desc: CryptoCipherAndIV | undefined
  if(liuDesc) {
    const res3 = checker.isLiuContentArr(liuDesc)
    if(!res3) {
      return {
        pass: false,
        result: {
          code: "E4000", taskId, errMsg: "liuDesc is illegal"
        }
      }
    }
    enc_desc = encryptDataWithAES(liuDesc, aesKey)
  }

  const enc_title = encryptDataWithAES(title, aesKey)
  const enc_images = images?.length ? encryptDataWithAES(images, aesKey) : undefined
  const enc_files = files?.length ? encryptDataWithAES(files, aesKey) : undefined
  
  return {
    pass: true,
    enc_title,
    enc_desc,
    enc_images,
    enc_files,
  }
}

// to get spaceType
async function getSharedData_8(
  ssCtx: SyncSetCtx,
  spaceId: string,
  opt: OperationOpt,
): Promise<GetShareDataRes_8> {
  const { taskId } = opt
  const theSpace = await getData<Table_Workspace>(ssCtx, "workspace", spaceId)
  if(!theSpace) {
    return {
      pass: false,
      result: { code: "E4004", errMsg: "workspace not found", taskId },
    }
  }

  const { oState } = theSpace
  if(oState === "REMOVED" || oState === "DELETED") {
    return {
      pass: false,
      result: {
        code: "E4003", errMsg: "workspace is removed or deleted", taskId
      }
    }
  }

  const spaceType = theSpace.infoType
  return { pass: true, spaceType }
}

// checking out the permission to edit member
async function getSharedData_7(
  ssCtx: SyncSetCtx,
  member: LiuUploadMember,
  opt: OperationOpt,
): Promise<GetShareDataRes_7> {
  const { taskId } = opt

  // 1. get the member
  const id = member.id as string
  const _m = await getData<Table_Member>(ssCtx, "member", id)
  if(!_m) {
    return {
      pass: false,
      result: { code: "E4004", taskId, errMsg: "the member cannot be found" },
    }
  }

  // 2. check out userId
  const userId = ssCtx.me._id
  const _userId = _m.user
  if(userId !== _userId) {
    return {
      pass: false,
      result: { code: "E4003", taskId, errMsg: "no permission of the member" },
    }
  }

  // 3. check out oState
  const oState = _m.oState
  if(oState === "DEACTIVATED" || oState === "DELETED") {
    return {
      pass: false,
      result: { code: "E4003", taskId, errMsg: "the member is deactivated or deleted" },
    }
  }
  
  return { pass: true, oldMember: _m }
}

// tackle changing oState of a content
async function getSharedData_6(
  ssCtx: SyncSetCtx,
  content: LiuUploadThread | LiuUploadComment,
  opt: OperationOpt,
  newOState: OState,
): Promise<GetShareDataRes_6> {
  const { taskId, operateStamp } = opt
  
  // 1. inspect data technically
  const Sch_OState = vbot.object({
    id: Sch_Id,
    first_id: Sch_Opt_Str,
  }, vbot.never())
  const res1 = checkoutInput(Sch_OState, content, taskId)
  if(res1) return { pass: false, result: res1 }

  // 2. get content and check permission
  const res2 = await getSharedData_3(ssCtx, taskId, content)
  if(!res2.pass) return res2

  // 3. start to check out every data
  const { oldContent } = res2
  const { oState, config: cfg = {} } = oldContent
  if(oState === newOState) {
    return { pass: true, result: { code: "0001", taskId }, oldContent }
  }
  const lastOStateStamp = cfg.lastOStateStamp ?? 1
  if(lastOStateStamp >= operateStamp) {
    return { pass: true, result: { code: "0002", taskId }, oldContent }
  }

  // 4. update data
  cfg.lastOStateStamp = operateStamp
  const u: Partial<Table_Content> = {
    oState: newOState,
    config: cfg,
  }
  if(newOState === "DELETED") {
    u.enc_title = undefined
    u.enc_desc = undefined
    u.enc_images = undefined
    u.enc_files = undefined
  }

  const id = content.id as string
  await updatePartData<Table_Content>(ssCtx, "content", id, u)
  return { pass: true, result: { code: "0000", taskId }, oldContent }
}

// check out content for reaction or favorite
async function getSharedData_5(
  ssCtx: SyncSetCtx,
  taskId: string,
  content_id: string,
): Promise<GetShareDataRes_5> {

  // 1. get content
  const oldContent = await getData<Table_Content>(ssCtx, "content", content_id)
  if(!oldContent) {
    return {
      pass: false,
      result: {
        code: "E4004", taskId, errMsg: "the content cannot be found"
      }
    } 
  }

  // 2. check out permission & get memberId
  const userId = ssCtx.me._id
  if(userId === oldContent.user) {
    const mId = oldContent.member
    return { pass: true, oldContent, userId, memberId: mId }
  }

  const res = _amIInTheSpace(ssCtx, oldContent.spaceId)
  if(!res) {
    if(oldContent.visScope === "PUBLIC") {
      return { pass: true, oldContent, userId }
    }
    return {
      pass: false,
      result: {
        code: "E4003", taskId, 
        errMsg: "no permission to collect or react the content",
      }
    }
  }

  const memberId = await getMyMemberId(ssCtx, userId, oldContent.spaceId)
  return { pass: true, oldContent, userId, memberId }
}

// get old collection
async function getSharedData_4(
  ssCtx: SyncSetCtx,
  taskId: string,
  collection_id: string,
): Promise<GetShareDataRes_4> {

  // 1. get data
  const oldCollection = await getData<Table_Collection>(
    ssCtx, "collection", collection_id
  )
  if(!oldCollection) {
    return {
      pass: false,
      result: {
        code: "E4004", taskId, errMsg: "the collection cannot be found"
      }
    }
  }

  // 2. check permission
  const userId = ssCtx.me._id
  if(userId !== oldCollection.user) {
    return {
      pass: false,
      result: {
        code: "E4003", taskId, errMsg: "no permission to edit the collection"
      }
    }
  }
  
  return { pass: true, oldCollection }
}

// get old content
async function getSharedData_3(
  ssCtx: SyncSetCtx,
  taskId: string,
  content: LiuUploadThread | LiuUploadComment,
): Promise<GetShareDataRes_3> {
  // 1. find the content
  const content_id = content.id as string
  const res1 = await getData<Table_Content>(ssCtx, "content", content_id)
  if(!res1) {
    return {
      pass: false,
      result: {
        code: "E4004", taskId, errMsg: "the content cannot be found"
      }
    }
  }

  // 2. check permission
  const res2 = canIEditTheContent(ssCtx, res1)
  if(!res2) {
    return {
      pass: false,
      result: {
        code: "E4003", taskId, errMsg: "no permission to edit the thread"
      }
    }
  }

  return {
    pass: true,
    content_id,
    oldContent: res1,
  }
}

async function getSharedData_2(
  ssCtx: SyncSetCtx,
  taskId: string,
  content: LiuUploadThread | LiuUploadComment,
): Promise<GetShareDataRes_2> {

  // 1. inspect liuDesc and encrypt
  const { liuDesc } = content
  const aesKey = getAESKey() ?? ""
  let enc_desc: CryptoCipherAndIV | undefined
  if(liuDesc) {
    const res3 = checker.isLiuContentArr(liuDesc)
    if(!res3) {
      return {
        pass: false,
        result: {
          code: "E4000", taskId, errMsg: "liuDesc is illegal"
        }
      }
    }
    enc_desc = encryptDataWithAES(liuDesc, aesKey)
  }

  // 2. get oldContent & content_id
  const res2 = await getSharedData_3(ssCtx, taskId, content)
  if(!res2.pass) {
    return res2
  }
  const { content_id, oldContent } = res2

  // 3. check editedStamp
  const editedStamp = content.editedStamp as number
  if(oldContent.editedStamp > editedStamp) {
    return {
      pass: false,
      result: { code: "0002", taskId }
    }
  }

  // 4. get enc_images enc_files
  const { images, files } = content
  const enc_images = images?.length ? encryptDataWithAES(images, aesKey) : undefined
  const enc_files = files?.length ? encryptDataWithAES(files, aesKey) : undefined
  // TODO: enc_search_text

  return {
    pass: true,
    content_id,
    oldContent,
    enc_desc,
    enc_images,
    enc_files
  }
}



/** get shared data for thread or comment */
async function getSharedData_1(
  ssCtx: SyncSetCtx,
  taskId: string,
  content: LiuUploadThread | LiuUploadComment,
): Promise<GetShareDataRes_1> {
  
  // 1. get some important parameters
  const { spaceId, first_id } = content
  const { _id: userId } = ssCtx.me
  if(!spaceId || !first_id) {
    return { 
      pass: false,
      result: {
        code: "E4000", taskId, 
        errMsg: "spaceId and first_id are required",
      }
    }
  }

  // 2. check if the user is in the space
  const isInTheSpace = _amIInTheSpace(ssCtx, spaceId)
  if(!isInTheSpace) {
    return { 
      pass: false,
      result: {
        code: "E4003", taskId, errMsg: "you are not in the workspace"
      }
    }
  }

  // 3. inspect liuDesc and encrypt
  const { liuDesc } = content
  const aesKey = getAESKey() ?? ""
  let enc_desc: CryptoCipherAndIV | undefined
  if(liuDesc) {
    const res3 = checker.isLiuContentArr(liuDesc)
    if(!res3) {
      return {
        pass: false,
        result: {
          code: "E4000", taskId, errMsg: "liuDesc is illegal"
        }
      }
    }
    enc_desc = encryptDataWithAES(liuDesc, aesKey)
  }

  // 4. get memberId
  // TODO: the operation might not be required to post a comment
  const memberId = await getMyMemberId(ssCtx, userId, spaceId)
  if(!memberId) {
    return {
      pass: false,
      result: {
        code: "E4003", taskId,
        errMsg: "you do not have a memberId in the workspace"
      }
    }
  }

  // 5. get enc_images enc_files
  const { images, files } = content
  const enc_images = images?.length ? encryptDataWithAES(images, aesKey) : undefined
  const enc_files = files?.length ? encryptDataWithAES(files, aesKey) : undefined
  // TODO: enc_search_text

  return { 
    pass: true, 
    spaceId, first_id, userId,
    memberId,
    enc_desc,
    enc_images,
    enc_files,
  }
}



function _amIInTheSpace(
  ssCtx: SyncSetCtx,
  spaceId: string,
) {
  const space_ids = ssCtx.space_ids
  return space_ids.includes(spaceId)
}

/******************************** init ssCtx ***************************/
function initSyncSetCtx(
  user: Table_User,
  space_ids: string[],
) {
  const ssCtx: SyncSetCtx = {
    content: new Map<string, SyncSetCtxAtom<Table_Content>>(),
    draft: new Map<string, SyncSetCtxAtom<Table_Draft>>(),
    member: new Map<string, SyncSetCtxAtom<Table_Member>>(),
    workspace: new Map<string, SyncSetCtxAtom<Table_Workspace>>(),
    collection: new Map<string, SyncSetCtxAtom<Table_Collection>>(),
    me: user,
    space_ids,
    lastUsedStamp: 0,
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


// get current stamp which is unused
function getUnusedStamp(ssCtx: SyncSetCtx) {
  const oldStamp = ssCtx.lastUsedStamp
  const now = getNowStamp()
  if(now > oldStamp) {
    ssCtx.lastUsedStamp = now
    return now
  }
  const res = oldStamp + 1
  ssCtx.lastUsedStamp = res
  return res
}

function getBasicStampWhileAdding(ssCtx: SyncSetCtx) {
  const now = getUnusedStamp(ssCtx)
  return {
    insertedStamp: now,
    updatedStamp: now,
  }
}

// update part data
async function updatePartData<T extends SyncSetTable>(
  ssCtx: SyncSetCtx,
  key: keyof SyncSetCtx,
  id: string,
  partData: Partial<T>,
) {
  if(typeof key !== "string") {
    throw new Error("key must be string")
  }
  if(!partData.updatedStamp) {
    partData.updatedStamp = getUnusedStamp(ssCtx)
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


// to update all data
async function updateAllData(
  ssCtx: SyncSetCtx,
) {
  const { content, draft, member, workspace } = ssCtx
  await toUpdateTable(content, "Content")
  await toUpdateTable(draft, "Draft")
  await toUpdateTable(workspace, "Workspace")
  await toUpdateTable(member, "Member")
}


interface ToUpdateItem<T> {
  id: string
  updateData: Partial<T>
}

async function toUpdateTable<T>(
  map: Map<string, SyncSetCtxAtom<T>>,
  tableName: TableName,
) {
  const list: ToUpdateItem<T>[] = []
  map.forEach((atom, id) => {
    atom.updateData && list.push({ id, updateData: atom.updateData })
  })
  if(list.length < 1) return true
  const col = db.collection(tableName)
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { id, updateData } = v

    // using _.remove() or _.set() to update
    // to avoid MongoServerError: 
    // Cannot create field 'cipherText' in element {enc_desc: null}
    const _u: Record<string, any> = {}
    const keys = Object.keys(updateData) as (keyof T)[]
    for(let j=0; j<keys.length; j++) {
      const key = keys[j]
      const val = updateData[key]
      let newVal: any
      if(typeof val === "undefined") {
        newVal = _.remove()
      }
      else {
        newVal = _.set(val)
      }
      _u[key as string] = newVal
    }
    
    const res = await col.doc(id).update(_u)
  }
  return true
}


// insert data
// if ok, return a new id
type T_InsertData = Table_Content | Table_Draft | Table_Collection
async function insertData<T extends T_InsertData>(
  ssCtx: SyncSetCtx,
  key: "content" | "draft" | "collection",
  data: Partial<T>,
) {
  const col_name = key[0].toUpperCase() + key.substring(1)
  const res = await db.collection(col_name).add(data)
  const id = getDocAddId(res)
  if(!id) return

  const completedData = { ...data, _id: id } as T
  const map = ssCtx[key] as Map<string, SyncSetCtxAtom<T>>
  const atom: SyncSetCtxAtom<T> = { data: completedData }
  map.set(id, atom)
  return id
}
