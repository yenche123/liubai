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

/**
 * 去检查是否要添加任务到 db 中
 * @param task 
 * @returns boolean true: 表示要触发 preTrigger； false: 表示不需要
 */
export async function addUploadTask(
  param: UploadTaskParam,
  user: string,
) {
  const taskType = param.uploadTask
  const isUndo = taskType.includes("undo_")

  let addRequired = true

  // 1. 检查是否要添加
  if(isUndo) {
    addRequired = await whenUndo(param.target_id, user, taskType)
  }
  else if(taskType === "thread-edit") {
    addRequired = await whenContentEdit(param.target_id, user)
  }
  else if(taskType === "comment-edit") {
    addRequired = await whenContentEdit(param.target_id, user)
  }
  if(!addRequired) return
  
  // 2. 检查是否已存在，若存在去删除旧的任务
  if(taskType === "workspace-tag") {
    await checkForWorkspace(param.target_id, user, taskType)
  }
  else if(taskType === "member-avatar" || taskType === "member-nickname") {
    await checkForMember(param.target_id, user, taskType)
  }
  else if(taskType === "draft-clear" || taskType === "draft-set") {
    await checkDraft(param.target_id, user)
  }

  // 3. 把 target_id 转换成对应的 id
  let content_id: string | undefined
  let workspace_id: string | undefined
  let member_id: string | undefined
  let draft_id: string | undefined

  if(taskType === "workspace-tag") {
    workspace_id = param.target_id
  }
  else if(taskType === "member-avatar" || taskType === "member-nickname") {
    member_id = param.target_id
  }
  else if(taskType === "draft-clear" || taskType === "draft-set") {
    draft_id = param.target_id
  }
  else {
    content_id = param.target_id
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
    newBool: param.newBool,
    newStr: param.newStr,
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


/** checking out if the task related to member has already been added */
async function checkForMember(
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
async function checkForWorkspace(
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
  const idx = undoType.indexOf("undo_")
  if(idx !== 0) {
    console.warn("undoType is not started with 'undo_'")
    return false
  }

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
