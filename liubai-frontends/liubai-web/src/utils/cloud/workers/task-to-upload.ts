import time from "~/utils/basic/time"
import type { 
  UploadTaskLocalTable,
} from "~/types/types-table"
import { db } from "~/utils/db"
import localCache from "~/utils/system/local-cache"
import { handleFiles } from "./tools/handle-files"


/** check 10 tasks */
async function handle10Tasks(tasks: UploadTaskLocalTable[]) {

  await handleFiles(tasks)



}

// 每次查询出 LIMIT 个 upload_tasks
const LIMIT = 10

/** worker 入口函数 */
onmessage = async (e) => {

  let times = 0
  const { local_id: user } = localCache.getPreference()
  if(!user) {
    console.warn("there is no local id in preference")
    postMessage("unknown")
    return
  }

  while(true) {
    times++
    if(times > 10) return

    
    const now = time.getTime()
    const filterFunc = (task: UploadTaskLocalTable) => {
      const t1 = task.failedStamp
      if(t1 && (now - t1) < time.MINUTE) return false
      if(task.user !== user) return false
      return true      
    }

    const col = db.upload_tasks.orderBy("insertedStamp").filter(filterFunc)
    const results = await col.limit(LIMIT).toArray()
    const len = results.length
    if(len < 1) break


    await handle10Tasks(results)

  }

  postMessage("success")
  
}