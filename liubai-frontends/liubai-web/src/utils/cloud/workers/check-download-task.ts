import { db } from "~/utils/db"
import type { TaskOfC2L } from "../tools/types"
import type { DownloadTaskLocalTable } from "~/types/types-table"
import ider from "~/utils/basic/ider"
import time from "~/utils/basic/time"

onmessage = async (e) => {
  const tmp_tasks = e.data as TaskOfC2L[]
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
      // 已存在，略过
      continue
    }

    // 把数据加进 IndexedDB 中
    const newId = ider.createDownloadTaskId()
    const newData: DownloadTaskLocalTable = {
      _id: newId,
      insertedStamp: now + i,
      target_id: v.id,
      target_table: v.table,
    }
    const res2 = await db.download_tasks.add(newData)
  }

  postMessage("checked")
}