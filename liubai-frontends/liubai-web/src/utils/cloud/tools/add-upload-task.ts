// 把上传任务添加进 local db
// 处理一些可抵消的操作，比如
// 动态被编辑，若动态被新建的任务还在 local db 中，则不需要再有编辑任务

import type { UploadTaskLocalTable } from "~/types/types-table";
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

  if(isUndo) {
    addRequired = await whenUndo(param.target_id, user, taskType)
  }
  else if(taskType === "thread-edit") {
    addRequired = await whenContentEdit(param.target_id, user)
  }
  else if(taskType === "comment-edit") {
    addRequired = await whenContentEdit(param.target_id, user)
  }

  if(!addRequired) {
    return false
  }

  const newTask: UploadTaskLocalTable = {
    _id: ider.createUploadTaskId(),
    insertedStamp: time.getTime(),
    user,
    uploadTask: taskType,
    content_id: param.target_id,   // TODO: 目前都是 content_id 罢了
                                   // 后期可能会有操作其他的东西
    newBool: param.newBool,
    newStr: param.newStr,
    uploading: false,
  }
  const res = await db.upload_tasks.add(newTask)
  return true
}


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
    uploading: false,
  }
  const res = await db.upload_tasks.where(w).toArray()

  if(res.length < 1) {
    return true
  }
  
  const origin_id = res[0]._id
  if(!origin_id) {
    return true
  }

  await db.upload_tasks.delete(origin_id)

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
    uploading: false,
  }

  const res = await db.upload_tasks.where(w).toArray()
  return res.length < 1
}
