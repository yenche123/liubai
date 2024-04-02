
// 由于 qiniu 的 sdk 使用到了 window 对象，所以不得在 worker 中使用之，否则会报错

import time from "~/utils/basic/time"
import type { 
  UploadTaskLocalTable,
} from "~/types/types-table"
import { db } from "~/utils/db"
import localCache from "~/utils/system/local-cache"
import { handleFiles } from "./handle-files"

/** check 10 tasks */
async function handle10Tasks(tasks: UploadTaskLocalTable[]) {

  // 1. uploading related files
  const res1 = await handleFiles(tasks)
  if(!res1) {
    return false
  }

  // 2. 




}

const LIMIT = 10
export async function handleUploadTasks() {

  let times = 0
  while(true) {
    times++
    if(times > 10) break

    const { local_id: userId } = localCache.getPreference()
    if(!userId) break

    const now = time.getTime()
    const filterFunc = (task: UploadTaskLocalTable) => {
      const t1 = task.failedStamp
      if(t1 && (now - t1) < time.MINUTE) return false
      if(task.user !== userId) return false
      return true      
    }
    
    const col = db.upload_tasks.orderBy("insertedStamp").filter(filterFunc)
    const results = await col.limit(LIMIT).toArray()
    const len = results.length
    if(len < 1) break


    const res = await handle10Tasks(results)
    if(!res) break
  }


  return true
}