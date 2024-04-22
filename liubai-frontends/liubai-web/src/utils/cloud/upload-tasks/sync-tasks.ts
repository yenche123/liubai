import APIs from "~/requests/APIs";
import type { 
  UploadTaskLocalTable,
} from "~/types/types-table";
import time from "~/utils/basic/time";
import { db } from "~/utils/db";
import { packSyncSetAtoms } from "./tools/prepare-for-uploading";

export async function syncTasks(tasks: UploadTaskLocalTable[]) {

  // 0. define the filter function
  const now = time.getTime()
  const _filterFunc = (task: UploadTaskLocalTable) => {
    const t1 = task.failedStamp
    if(t1 && (now - t1) < time.MINUTE) return false
    if(task.progressType !== "waiting") return false
    return true      
  }

  // 1. get tasks again
  const taskIds = tasks.map(v => v._id)
  const col_1 = db.upload_tasks.where("_id").anyOf(taskIds)
  const col_2 = col_1.filter(_filterFunc)
  const res1 = await col_2.toArray()
  if(res1.length < 1) return true

  packSyncSetAtoms(res1)

  
}