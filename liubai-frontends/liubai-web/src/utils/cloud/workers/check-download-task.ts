import { db } from "~/utils/db"
import type { CheckDownloadTaskParam } from "../tools/types"
import type { DownloadTaskLocalTable } from "~/types/types-table"
import ider from "~/utils/basic/ider"
import time from "~/utils/basic/time"
import { endWorker, initWorker } from "./tools/worker-funcs"

onmessage = async (e) => {
  
  const param = e.data as CheckDownloadTaskParam
  const tmp_tasks = param.tasks
  const msg = param.msg
  await initWorker(msg)

  const len = tmp_tasks.length
  if(len < 1) return

  const now = time.getTime()
  for(let i=0; i<len; i++) {
    const v = tmp_tasks[i]
    const g = {
      target_id: v.id,
      target_table: v.table,
    }
    const res = await db.download_tasks.get(g)
    if(res?._id) {
      if(res.file_id === v.file_id) {
        continue
      }
    }

    // 把数据加进 IndexedDB 中
    const newId = ider.createDownloadTaskId()
    const newData: DownloadTaskLocalTable = {
      _id: newId,
      insertedStamp: now + i,
      target_id: v.id,
      target_table: v.table,
      file_id: v.file_id,
    }
    const res2 = await db.download_tasks.add(newData)
  }

  endWorker()
  postMessage("checked")
}