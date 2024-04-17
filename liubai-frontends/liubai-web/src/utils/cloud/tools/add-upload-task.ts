// 把上传任务添加进 local db
// 处理一些可抵消的操作，比如
// 动态被编辑，若动态被新建的任务还在 local db 中，则不需要再有编辑任务

import type { 
  UploadTaskLocalTable,
} from "~/types/types-table";
import type { UploadTaskParam } from "./types";
import { db } from "~/utils/db";
import { type LiuUploadTask, liuUploadTasks } from "~/types/types-atom";
import time from "~/utils/basic/time";
import ider from "~/utils/basic/ider";

// 属于再编辑的操作，只会修改 Content 表，不会影响其他表的操作
// 这些操作，若在队列里发现 content-post 存在，就不需要额外再去触发这些事件了
// 因为它们的状态会跟着 content-post 一起被上传
const content_edit_events: LiuUploadTask[] = [
  "thread-edit",
  "comment-edit",
  "thread-hourglass",
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
  const isContentEdited = content_edit_events.includes(taskType)

  let addRequired = true

  // 1. 检查是否要添加
  if(isUndo) {
    addRequired = await whenUndo(target_id, user, taskType)
  }
  else if(isContentEdited) {
    addRequired = await whenContentEdit(target_id, user)
  }
  if(!addRequired) return
  
  // 2. 检查是否已存在，若存在去删除旧的任务
  const isThread = taskType.startsWith("thread-")
  const isComment = taskType.startsWith("comment-")
  const isWorkspace = taskType.startsWith("workspace-")
  const isMember = taskType.startsWith("member-")
  const isDraft = taskType.startsWith("draft-")

  if(isThread || isComment) {
    await checkContent(target_id, user, taskType)
  }
  if(isWorkspace) {
    await checkWorkspace(target_id, user, taskType)
  }
  else if(isMember) {
    await checkMember(target_id, user, taskType)
  }
  else if(isDraft) {
    await checkDraft(target_id, user)
  }

  // 3. 把 target_id 转换成对应的 id
  let content_id: string | undefined
  let workspace_id: string | undefined
  let member_id: string | undefined
  let draft_id: string | undefined

  if(isWorkspace) {
    workspace_id = target_id
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
  const now4 = time.getTime()
  const newTask: UploadTaskLocalTable = {
    _id: ider.createUploadTaskId(),
    insertedStamp: now4,
    updatedStamp: now4,
    user,
    uploadTask: taskType,
    content_id,
    workspace_id,
    member_id,
    draft_id,
    progressType: "waiting",
  }
  const res = await db.upload_tasks.add(newTask)
  return true
}


/** check out if there are draft-clear and draft-clear in upload_tasks 
 *  when new task about draft is triggered 
 */
async function checkDraft(
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
  if(res.length < 1) return

  const task_ids = res.map(v => v._id)
  console.log("to delete these tasks: ", task_ids)
  await db.upload_tasks.bulkDelete(task_ids)
}

/** checking out if the task related to content has already been added */
async function checkContent(
  content_id: string,
  user: string,
  taskType: LiuUploadTask,
) {
  const w: Partial<UploadTaskLocalTable> = {
    user,
    uploadTask: taskType,
    content_id,
    progressType: "waiting",
  }
  const res = await db.upload_tasks.where(w).toArray()
  if(res.length < 1) return
  
  const origin_id = res[0]._id
  await deleteTheTask(origin_id)
}


/** checking out if the task related to member has already been added */
async function checkMember(
  member_id: string,
  user: string,
  taskType: LiuUploadTask,
) {
  const w: Partial<UploadTaskLocalTable> = {
    user,
    uploadTask: taskType,
    member_id,
    progressType: "waiting",
  }
  const res = await db.upload_tasks.where(w).toArray()
  if(res.length < 1) return
  
  const origin_id = res[0]._id
  await deleteTheTask(origin_id)
}

/** checking out if the task related to workspace has already been added */
async function checkWorkspace(
  workspace_id: string,
  user: string,
  taskType: LiuUploadTask,
) {
  const w: Partial<UploadTaskLocalTable> = {
    user,
    uploadTask: taskType,
    workspace_id,
    progressType: "waiting",
  }
  const res = await db.upload_tasks.where(w).toArray()
  if(res.length < 1) return

  const origin_id = res[0]._id
  await deleteTheTask(origin_id)
}

/** checking out if the original task of undo has already been added 
 * if yes, then delete it, and return false to represent that 
 * there is no need to add
*/
async function whenUndo(
  content_id: string,
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
    content_id,
    progressType: "waiting",
  }
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
 * 去查找是否有 content-post 的任务
 * 若有，则返回 false，表示无需再添加【编辑任务】至 local db
 */
async function whenContentEdit(
  content_id: string,
  user: string,
) {
  const w: Partial<UploadTaskLocalTable> = {
    user,
    uploadTask: "content-post",
    content_id,
    progressType: "waiting",
  }

  const res = await db.upload_tasks.where(w).toArray()
  return res.length < 1
}

async function deleteTheTask(
  taskId: string,
) {
  await db.upload_tasks.delete(taskId)
  return true
}
