// To change the state of the local task
// if you want to delete a task, see its corresponding content,
// and check if it can be directly switched to LOCAL

import type {
  ContentLocalTable,
  UploadTaskLocalTable,
} from "~/types/types-table"
import { db } from "~/utils/db"
import type { UploadTaskProgressType } from "~/types/types-atom"
import time from "~/utils/basic/time"
import cfg from "~/config"


async function toDeleteTask(
  taskId: string,
) {
  await db.upload_tasks.delete(taskId)
}

async function tryToChangeStorageState(
  content_id: string
) {
  const content = await db.contents.get(content_id)
  if(!content) return

  const { storageState: st, infoType } = content
  if(infoType !== "THREAD") return
  if(st !== "CLOUD" && st !== "WAIT_UPLOAD") return
  
  const opt: Partial<ContentLocalTable> = {
    storageState: "LOCAL",
    updatedStamp: time.getTime(),
  }
  const res = await db.contents.update(content_id, opt)
  console.log("tryToChangeStorageState..........")
  console.log(res)
  console.log(" ")
}


interface AddTryTimesRes {
  keepGoing: boolean
  newTryTimes?: number
}

/** to add try times 
 *  if the task is not in db, then return { keepGoing: true }
 *  if the task is in db, add tryTimes
 *  if tryTimes is bigger than fail_to_upload_max, check its content
 *  and delete the task
*/
async function toAddTryTimes(
  taskId: string
): Promise<AddTryTimesRes> {
  const task = await db.upload_tasks.get(taskId)
  if(!task) return { keepGoing: true }

  let tryTimes = task.tryTimes ?? 0
  tryTimes++
  if(tryTimes > cfg.fail_to_upload_max) {
    if(task.uploadTask === "content-post" && task.content_id) {
      await tryToChangeStorageState(task.content_id)
    }
    await toDeleteTask(taskId)
    return { keepGoing: false }
  }

  let newTryTimes = tryTimes
  return { keepGoing: true, newTryTimes }
}

async function changeProgressType(
  taskId: string, 
  progressType: UploadTaskProgressType,
  addTryTimes: boolean = false,
) {
  let tryTimes = 0
  if(addTryTimes) {
    const { 
      keepGoing, 
      newTryTimes,
    } = await toAddTryTimes(taskId)
    if(!keepGoing) return
    if(newTryTimes) tryTimes = newTryTimes
  }

  const now = time.getTime()
  const opt1: Partial<UploadTaskLocalTable> = {
    progressType,
    updatedStamp: now,
  }
  if(tryTimes) {
    opt1.tryTimes = tryTimes
    opt1.failedStamp = now
  }
  const res = await db.upload_tasks.update(taskId, opt1)
  return res
}


export default {
  changeProgressType,
}