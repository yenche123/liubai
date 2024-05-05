import { 
  checkIfUserSubscribed, 
  verifyToken,
  getDocAddId,
  checker,
  getAESKey,
  encryptDataWithAES,
  getDecryptedBody,
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
} from "@/common-types"
import { 
  Sch_Simple_SyncSetAtom,
  Sch_Cloud_ImageStore,
  Sch_Cloud_FileStore,
  Sch_ContentConfig,
  Sch_LiuRemindMe,
  Sch_OState_2,
  Sch_Id,
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
  const res1 = preCheck()
  if(res1) return res1
  
  // 2. verify token
  const vRes = await verifyToken(ctx, body)
  const user = vRes.userData
  const workspaces = vRes.workspaces ?? []
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }

  // 3. decrypt body
  const res3 = getDecryptedBody(body, vRes)
  if(!res3.newBody || res3.rqReturn) {
    return res3.rqReturn ?? { code: "E5001" }
  }

  console.log("new body::")
  console.log(res3.newBody)

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
  "comment-post",
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
    else if(taskType === "thread-hourglass" && thread) {
      res1 = await toThreadHourglass(ssCtx, thread, opt)
    }
    else if(taskType === "undo_thread-hourglass" && thread) {
      res1 = await toThreadHourglass(ssCtx, thread, opt)
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
      toThreadTag(ssCtx, thread, opt)
    }
    else if(taskType === "comment-delete" && comment) {
      toComment_OState(ssCtx, comment, opt)
    }
    else if(taskType === "comment-edit" && comment) {
      toCommentEdit(ssCtx, comment, opt)
    }
    else if(taskType === "workspace-tag" && workspace) {
      toWorkspaceTag(ssCtx, workspace, opt)
    }
    else if(taskType === "workspace-state_config" && workspace) {
      toWorkspaceStateConfig(ssCtx, workspace, opt)
    }
    else if(taskType === "member-avatar" && member) {
      toMemberAvatar(ssCtx, member, opt)
    }
    else if(taskType === "member-nickname" && member) {
      toMemberNickname(ssCtx, member, opt)
    }
    else if(taskType === "draft-set" && draft) {
      toDraftSet(ssCtx, draft, opt)
    }
    else if(taskType === "draft-clear" && draft) {
      toDraftClear(ssCtx, draft, opt)
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

    liuDesc: vbot.optional(vbot.array(vbot.any())),
    images: vbot.optional(vbot.array(Sch_Cloud_ImageStore)),
    files: vbot.optional(vbot.array(Sch_Cloud_FileStore)),

    editedStamp: vbot.number(),
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
  const workspace = await getData<Table_Workspace>(ssCtx, "workspace", spaceId)
  if(!workspace) {
    return { 
      code: "E4004", taskId,
      errMsg: "workspace not found",
    }
  }
  const spaceType = workspace.infoType

  // 5. construct a new row of Table_Content
  const { title } = thread
  const enc_title = encryptDataWithAES(title, aesKey)

  // 6. construct a new row of Table_Content
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
    
    liuDesc: vbot.optional(vbot.array(vbot.any())),
    images: vbot.optional(vbot.array(Sch_Cloud_ImageStore)),
    files: vbot.optional(vbot.array(Sch_Cloud_FileStore)),
    
    editedStamp: vbot.number(),

    parentThread: vbot.optional(vbot.string()),
    parentComment: vbot.optional(vbot.string()),
    replyToComment: vbot.optional(vbot.string()),
    createdStamp: vbot.number(),
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
  const workspace = await getData<Table_Workspace>(ssCtx, "workspace", spaceId)
  if(!workspace) {
    return { 
      code: "E4004", taskId,
      errMsg: "workspace not found",
    }
  }
  const spaceType = workspace.infoType

  // 4. construct a new row of Table_Content
  const b4 = getBasicStampWhileAdding()
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
    emojiData: { total: 0, system: [] },
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
    first_id: vbot.optional(vbot.string()),

    liuDesc: vbot.optional(vbot.array(vbot.any())),
    images: vbot.optional(vbot.array(Sch_Cloud_ImageStore)),
    files: vbot.optional(vbot.array(Sch_Cloud_FileStore)),

    editedStamp: vbot.number(),
    title: vbot.optional(vbot.string()),
    calendarStamp: vbot.optional(vbot.number()),
    remindStamp: vbot.optional(vbot.number()),
    whenStamp: vbot.optional(vbot.number()),
    remindMe: vbot.optional(Sch_LiuRemindMe),

    tagIds: vbot.optional(vbot.array(vbot.string())),
    tagSearched: vbot.optional(vbot.array(vbot.string())),
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
    updatedStamp: getNowStamp(),
  }
  await updatePartData(ssCtx, "content", sharedData.content_id, new_data)
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
    first_id: vbot.optional(vbot.string()),
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
  const id = collection.id
  const newOState = collection.oState
  if(id) {
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
  const { taskId, operateStamp } = opt

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
  const id = collection.id
  const newOState = collection.oState
  const newEmoji = collection.emoji as string
  if(id) {
    const res2 = await getSharedData_4(ssCtx, taskId, id)
    if(!res2.pass) return res2.result
    const { oldCollection } = res2
    const oldEmoji = oldCollection.emoji
    const oldOState = oldCollection.oState
    if(oldEmoji === newEmoji && oldOState === newOState) {
      return { code: "0001", taskId }
    }
    const oldStamp = oldCollection.operateStamp ?? 1
    if(oldStamp >= operateStamp) {
      return { code: "0002", taskId }
    }
    const u = {
      oState: newOState,
      emoji: newEmoji,
      operateStamp,
    }
    await updatePartData<Table_Collection>(ssCtx, "collection", id, u)
    return { code: "0000", taskId }
  }

  // 3. handle shared logic
  const res3 = await toCollectionShared(ssCtx, collection, opt, "EXPRESS")
  return res3
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
  const b4 = getBasicStampWhileAdding()
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

  return { code: "0000", taskId, first_id, new_id }
}


/***************** Operation: operate oState of a thread *************/
async function toThread_OState(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
  newOState: OState,
) {
  const { taskId, operateStamp } = opt
  
  // 1. inspect data technically
  const Sch_OState = vbot.object({
    id: Sch_Id,
    first_id: vbot.optional(vbot.string()),
  }, vbot.never())
  const res1 = checkoutInput(Sch_OState, thread, taskId)
  if(res1) return res1

  // 2. get content and check permission
  const res2 = await getSharedData_3(ssCtx, taskId, thread)
  if(!res2.pass) return res2.result

  // 3. start to check out every data
  const { oState, config: cfg = {} } = res2.oldContent
  if(oState === newOState) {
    return { code: "0001", taskId }
  }
  const lastOStateStamp = cfg.lastOStateStamp ?? 1
  if(lastOStateStamp >= operateStamp) {
    return { code: "0002", taskId }
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

  const id = thread.id as string
  await updatePartData<Table_Content>(ssCtx, "content", id, u)
  return { code: "0000", taskId }
}

/***************** Operation: set a state of a thread (including undo) ***********/
async function toThreadState(
  ssCtx: SyncSetCtx,
  thread: LiuUploadThread,
  opt: OperationOpt,
): Promise<SyncSetAtomRes> {
  const { taskId } = opt

  // when user operated a state of thread, don't check out the conflict using stamp
  // just because the operation would also change the workspace
  // So just accept it!

  // 1. inspect data technically
  const Sch_State = vbot.object({
    id: Sch_Id,
    first_id: vbot.optional(vbot.string()),
    stateId: vbot.optional(vbot.string()),
  })
  const res1 = checkoutInput(Sch_State, thread, taskId)
  if(res1) return res1

  // 2. get shared data
  const res2 = await getSharedData_3(ssCtx, taskId, thread)
  if(!res2.pass) return res2.result
  const { oldContent } = res2

  const id = thread.id as string
  const stateId = thread.stateId
  if(oldContent.stateId === stateId) {
    return { code: "0001", taskId }
  }
  
  const u: Partial<Table_Content> = {
    stateId,
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
    first_id: vbot.optional(vbot.string()),
    pinStamp: vbot.optional(vbot.number()),
  })
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
) {
  const { taskId } = opt
  
}

/***************** Operation: update comment's oState ***********/
async function toComment_OState(
  ssCtx: SyncSetCtx,
  comment: LiuUploadComment,
  opt: OperationOpt,
) {
  const { taskId, operateStamp } = opt
  
}

/***************** Operation: edit a comment ***********/
async function toCommentEdit(
  ssCtx: SyncSetCtx,
  comment: LiuUploadComment,
  opt: OperationOpt,
) {
  const { taskId } = opt
  
}

/***************** Operation: update workspace's tag ***********/
async function toWorkspaceTag(
  ssCtx: SyncSetCtx,
  workspace: LiuUploadWorkspace,
  opt: OperationOpt,
) {
  const { taskId, operateStamp } = opt
  
}

/*********** Operation: update workspace's state_config ****/
async function toWorkspaceStateConfig(
  ssCtx: SyncSetCtx,
  workspace: LiuUploadWorkspace,
  opt: OperationOpt,
) {
  const { taskId, operateStamp } = opt
  
}

/*********** Operation: update member's avatar ****/
async function toMemberAvatar(
  ssCtx: SyncSetCtx,
  member: LiuUploadMember,
  opt: OperationOpt,
) {
  const { taskId } = opt
  
}

/*********** Operation: update member's nickname ****/
async function toMemberNickname(
  ssCtx: SyncSetCtx,
  member: LiuUploadMember,
  opt: OperationOpt,
) {
  const { taskId, operateStamp } = opt
  
}

/*********** Operation: set draft ****/
async function toDraftSet(
  ssCtx: SyncSetCtx,
  member: LiuUploadDraft,
  opt: OperationOpt,
) {
  const { taskId, operateStamp } = opt
  
}

/*********** Operation: clear draft ****/
async function toDraftClear(
  ssCtx: SyncSetCtx,
  member: LiuUploadDraft,
  opt: OperationOpt,
) {
  const { taskId, operateStamp } = opt
  
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

type GetShareDataRes_1 = Gsdr_A | Gsdr_1_B
type GetShareDataRes_2 = Gsdr_A | Gsdr_2_B
type GetShareDataRes_3 = Gsdr_A | Gsdr_3_B
type GetShareDataRes_4 = Gsdr_A | Gsdr_4_B
type GetShareDataRes_5 = Gsdr_A | Gsdr_5_B

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

  // 1. get oldContent & content_id
  const res1 = await getSharedData_3(ssCtx, taskId, content)
  if(!res1.pass) {
    return res1
  }
  const { content_id, oldContent } = res1

  // 2. check editedStamp
  const editedStamp = content.editedStamp as number
  if(oldContent.editedStamp > editedStamp) {
    console.log("the content is newer than the thread")
    return {
      pass: false,
      result: { code: "0002", taskId }
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
    partData.updatedStamp = getNowStamp()
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
  await toUpdateTable(workspace, "workspace")
  await toUpdateTable(member, "Member")
}


interface ToUpdateItem<T> {
  id: string
  updateData: Partial<T>
}

async function toUpdateTable<T>(
  map: Map<string, SyncSetCtxAtom<T>>,
  tableName: string,
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
    const res = await col.doc(id).update(updateData)
    console.log(`update ${tableName} ${id} result: `, res)
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
