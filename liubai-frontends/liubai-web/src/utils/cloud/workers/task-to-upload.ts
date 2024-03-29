import time from "~/utils/basic/time"
import type { 
  UploadTaskLocalTable,
} from "~/types/types-table"
import { db } from "~/utils/db"
import { handleFiles } from "./tools/handle-files"
import type { MainToChildMessage } from "../tools/types"
import { initWorker } from "./tools/worker-funcs"


/** check 10 tasks */
async function handle10Tasks(tasks: UploadTaskLocalTable[]) {

  // 1. uploading related files
  const res1 = await handleFiles(tasks)
  if(!res1) {
    return false
  }

  // 2. 




}

// 每次查询出 LIMIT 个 upload_tasks
const LIMIT = 10

async function start(msg: MainToChildMessage) {

  // 1. init
  initWorker(msg)

  // 2. check if userId is existed
  if(!msg.userId) {
    console.warn("there is no userId in preference")
    postMessage("unknown")
    return
  }

  let times = 0
  while(true) {
    times++
    if(times > 10) return
    
    const now = time.getTime()
    const filterFunc = (task: UploadTaskLocalTable) => {
      const t1 = task.failedStamp
      if(t1 && (now - t1) < time.MINUTE) return false
      if(task.user !== msg.userId) return false
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

function updateToken(msg: MainToChildMessage) {
  initWorker(msg)
}

/** worker 入口函数 */
onmessage = (e) => {
  const msg = e.data as MainToChildMessage
  
  const evt = msg.event
  if(evt === "start") {
    start(msg)
  }
  else if(evt === "update_token") {
    updateToken(msg)
  }
  else {
    console.warn("unknown event in task-to-upload worker")
  }

}