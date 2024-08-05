// 把上传任务添加进 local db
// 处理一些可抵消的操作，比如
// 动态被编辑，若动态被新建的任务还在 local db 中，则不需要再有编辑任务

import type { 
  UploadTaskLocalTable,
} from "~/types/types-table";
import type { 
  UploadTaskParam,
  UploadTaskLocalTable_ID,
} from "./types";
import { db } from "~/utils/db";
import { type LiuUploadTask, liuUploadTasks } from "~/types/types-atom";
import { classifyUploadTask, content_evts } from "./upload-event-classification"
import ider from "~/utils/basic/ider";

// 属于再编辑的操作，只会修改 Content 表，不会影响其他表的操作
const content_edit_events: LiuUploadTask[] = [
  "thread-edit",
  "thread-only_local",
  "thread-hourglass",
  "thread-when-remind",
  "thread-state",
  "thread-pin",
  "thread-tag",
]

/**
 * 去检查是否要添加任务到 db 中
 * @param task 
 * @returns boolean true: 表示要触发 preTrigger； false: 表示不需要
 */
export async function addUploadTask(
  param: UploadTaskParam,
  user: string,
) {
  const target_id = param.target_id
  const taskType = param.uploadTask
  const isUndo = taskType.startsWith("undo_")
  const isThreadEdited = content_edit_events.includes(taskType)
  const isCommentEdited = taskType === "comment-edit"
  const isDraftClear = taskType === "draft-clear"
  const isDraftSet = taskType === "draft-set"

  // 0. classify
  const { 
    isContent,
    isWorkspace,
    isMember,
    isDraft,
    isCollection,
  } = classifyUploadTask(taskType)

  // 1. checking out if the task is required to add
  let addRequired = true
  if(isUndo) {
    let key: UploadTaskLocalTable_ID = "content_id"
    if(isWorkspace) key = "workspace_id"
    addRequired = await whenUndo(key, target_id, user, taskType)
  }
  else if(taskType === "thread-restore") {
    addRequired = await whenRestoreThread(target_id, user)
  }
  else if(isThreadEdited) {
    addRequired = await whenContentEdit(target_id, user, "thread-post")
  }
  else if(isCommentEdited) {
    addRequired = await whenContentEdit(target_id, user, "comment-post")
  }
  else if(isDraftClear) {
    addRequired = await whenDraftClear(target_id, user)
  }
  if(!addRequired) return
  
  // 2. 检查是否已存在，若存在去删除旧的任务
  if(taskType === "thread-only_local") {
    await checkThreadOnlyLocal(target_id, user)
  }
  else if(isContent) {
    await checkDuplicated("content_id", target_id, user, taskType)
  }
  else if(isCollection) {
    await checkDuplicated("collection_id", target_id, user, taskType)
  }
  else if(isWorkspace) {
    await checkDuplicated("workspace_id", target_id, user, taskType)
  }
  else if(isMember) {
    await checkDuplicated("member_id", target_id, user, taskType)
  }
  else if(isDraftSet) {
    await checkDraftSet(target_id, user)
  }

  // 3. 把 target_id 转换成对应的 id
  let content_id: string | undefined
  let collection_id: string | undefined
  let workspace_id: string | undefined
  let member_id: string | undefined
  let draft_id: string | undefined

  if(isWorkspace) {
    workspace_id = target_id
  }
  else if(isCollection) {
    collection_id = target_id
  }
  else if(isMember) {
    member_id = target_id
  }
  else if(isDraft) {
    draft_id = target_id
  }
  else {
    content_id = target_id
  }

  // 4. 组装 task
  const newTask: UploadTaskLocalTable = {
    _id: ider.createUploadTaskId(),
    insertedStamp: param.operateStamp,
    updatedStamp: param.operateStamp,
    user,
    uploadTask: taskType,
    content_id,
    collection_id,
    workspace_id,
    member_id,
    draft_id,
    progressType: "waiting",
  }
  const res = await db.upload_tasks.add(newTask)
  return true
}

async function whenDraftClear(
  draft_id: string,
  user: string,
) {
  const filterTasks: LiuUploadTask[] = ["draft-clear", "draft-set"]
  const filterFunc = (item: UploadTaskLocalTable) => {
    return filterTasks.includes(item.uploadTask)
  }
  const w: Partial<UploadTaskLocalTable> = {
    user,
    draft_id,
    progressType: "waiting",
  }
  const res = await db.upload_tasks.where(w).filter(filterFunc).toArray()
  if(res.length < 1) return true

  const task_ids = res.map(v => v._id)
  console.warn('whenDraftClear to delete these tasks: ', task_ids)
  await db.upload_tasks.bulkDelete(task_ids)

  if(draft_id.startsWith("d0")) {
    return false
  }

  return true
}

// 因为 draft 不再同步文件，所以遇到新的 draft-set 时，直接删除旧的，也不会发生
// 文件正在上传，上传完毕后找不到原 upload task id 或 触发多次上传文件的问题
async function checkDraftSet(
  draft_id: string,
  user: string,
) {
  const w: Partial<UploadTaskLocalTable> = {
    user,
    draft_id,
    progressType: "waiting",
    uploadTask: "draft-set",
  }
  const res = await db.upload_tasks.where(w).toArray()
  if(res.length < 1) return

  const task_ids = res.map(v => v._id)
  await db.upload_tasks.bulkDelete(task_ids)
}

async function checkThreadOnlyLocal(
  content_id: string,
  user: string,
) {
  const filterTasks = content_evts
  const filterFunc = (item: UploadTaskLocalTable) => {
    return filterTasks.includes(item.uploadTask)
  }
  const w: Partial<UploadTaskLocalTable> = {
    user,
    content_id,
    progressType: "waiting",
  }
  const res = await db.upload_tasks.where(w).filter(filterFunc).toArray()
  if(res.length < 1) return

  const task_ids = res.map(v => v._id)
  console.log("checkThreadOnlyLocal to delete these tasks: ", task_ids)
  await db.upload_tasks.bulkDelete(task_ids)
}

async function checkDuplicated(
  the_key: UploadTaskLocalTable_ID,
  the_id: string,
  user: string,
  taskType: LiuUploadTask,
) {
  const w: Partial<UploadTaskLocalTable> = {
    user,
    uploadTask: taskType,
    progressType: "waiting",
  }
  w[the_key] = the_id
  const res = await db.upload_tasks.where(w).toArray()
  if(res.length < 1) return
  
  const origin_id = res[0]._id
  await deleteTheTask(origin_id)
}


/** checking out if the original task of undo has already been added 
 * if yes, then delete it, and return false to represent that 
 * there is no need to add
*/
async function whenUndo<T extends UploadTaskLocalTable_ID>(
  key: T,
  val: UploadTaskLocalTable[T],
  user: string,
  undoType: LiuUploadTask,
) {
  const originType = undoType.substring(5) as LiuUploadTask
  const hasType = liuUploadTasks.includes(originType)
  if(!hasType) {
    console.warn("originType is not in liuUploadTasks")
    return false
  }

  const w: Partial<UploadTaskLocalTable> = {
    user,
    uploadTask: originType,
    progressType: "waiting",
  }
  w[key] = val
  const res = await db.upload_tasks.where(w).toArray()

  if(res.length < 1) {
    return true
  }
  
  const origin_id = res[0]._id
  if(!origin_id) {
    return true
  }

  await deleteTheTask(origin_id)

  return false
}

/**
 * 去查找是否有 thread-post 或 comment-post 的任务
 * 若有，则返回 false，表示无需再添加【编辑任务】至 local db
 */
async function whenContentEdit(
  content_id: string,
  user: string,
  uploadTask: "thread-post" | "comment-post",
) {
  const w: Partial<UploadTaskLocalTable> = {
    user,
    uploadTask,
    content_id,
    progressType: "waiting",
  }

  const res = await db.upload_tasks.where(w).toArray()
  return res.length < 1
}


/** checking out if the delete task has already been added 
 * if yes, then delete it and return false
 * otherwise return true
*/
async function whenRestoreThread(
  content_id: string,
  user: string,
) {
  const w: Partial<UploadTaskLocalTable> = {
    user,
    uploadTask: "thread-delete",
    content_id,
    progressType: "waiting",
  }
  const res = await db.upload_tasks.where(w).toArray()
  if(res.length > 0) {
    const origin_id = res[0]._id
    await deleteTheTask(origin_id)
    return false
  }
  return true
}


async function deleteTheTask(
  taskId: string,
) {
  await db.upload_tasks.delete(taskId)
  return true
}
