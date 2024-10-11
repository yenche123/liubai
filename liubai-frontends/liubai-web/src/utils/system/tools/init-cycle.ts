// 整个网页启动后
// 并且等待 route.name 有值，且在 "应用内"（即 inApp 不为 false）时
// 执行一些系统操作：
// 1. 将 DELETED 的 contents 都给删除
// 2. 将超过 30 天且为 REMOVED 的 contents 调整为 DELETED
// 3.1 将 uploadTask 中，progressType 为 syncing 并且 
//     updatedStamp 早于 5mins 的 task 改为 waiting
// 3.2 将 uploadTask 中，progressType 为 syncing 并且
//     updatedStamp 早于 30mins 的 task 改为 waiting

// 删除完后，不需要用 useThreadShowStore 通知各组件
// 因为各组件都不应显示出过期并且已删除的数据

import { useEnterIntoApp } from "~/hooks/useEnterIntoApp";
import time from "~/utils/basic/time";
import valTool from "~/utils/basic/val-tool";
import { db } from "~/utils/db";
import { 
  deleteThreadsFromWorkspaceStateCfg 
} from "~/hooks/thread/specific-operate/delete-related"
import type {
  BulkUpdateAtom_UploadTask
} from "~/utils/cloud/upload-tasks/tools/types"
import { useSystemStore } from "~/hooks/stores/useSystemStore";

const MIN_5 = time.MINUTE * 5
const MIN_30 = time.MINUTE * 30

export function initCycle() {

  useEnterIntoApp(async () => {
    await initHtmlLang()

    // 等个 2500 ms 再去处理这些背景操作
    await valTool.waitMilli(2500)

    await handleDeletedContents()
    await handleRemovedContents()
    await handleSyncingUploadTasks()

  })

}

async function initHtmlLang() {
  const sStore = useSystemStore()
  const lang = sStore.supported_lang
  const html = document.querySelector("html")
  html?.setAttribute("lang", lang)
}

// 将 DELETED 的 contents 都给删除
// 只加载最旧的 50 条
async function handleDeletedContents() {
  const col = db.contents.where({ oState: "DELETED" })
  const results = await col.limit(50).sortBy("updatedStamp")
  if(results.length < 1) return

  const ids = results.map(v => v._id)
  await db.contents.bulkDelete(ids)
}

// 将超过 30 天且为 REMOVED 的 contents 调整为 DELETED
async function handleRemovedContents() {
  const now = time.getTime()
  const DAYS_30_AGO = now - (30 * time.DAY)

  const w = ["oState", "updatedStamp"]
  const b1 = ["REMOVED", 1]
  const b2 = ["REMOVED", DAYS_30_AGO]
  const col = db.contents.where(w).between(b1, b2, false, false)
  const results = await col.limit(50).sortBy("updatedStamp")
  if(results.length < 1) return

  const ids = results.map(v => v._id)

  // 1. 先去修改 workspace.stateConfig
  await deleteThreadsFromWorkspaceStateCfg(ids)

  const list = results.map((v, i) => {
    v.oState = "DELETED"
    v.updatedStamp = now + i
    v.title = ""
    v.liuDesc = []
    v.images = []
    v.files = []
    v.tagIds = []
    v.tagSearched = []
    v.search_title = ""
    v.search_other = ""
    return v
  })

  // 2. 再去把动态都改为 "DELETED"
  const res2 = await db.contents.bulkPut(list)

}

async function handleSyncingUploadTasks() {

  // 1. get upload tasks
  const task_ids: string[] = []
  const col = db.upload_tasks.orderBy("updatedStamp").limit(10)
  const results = await col.toArray()

  // 2. get targeted task ids
  const now = time.getTime()
  results.forEach(v => {
    const { progressType, updatedStamp, _id } = v
    if(progressType === "waiting") return

    const diff = now - updatedStamp
    if(progressType === "file_uploading") {
      if(diff > MIN_30) {
        task_ids.push(_id)
      }
    }
    else if(progressType === "syncing") {
      if(diff > MIN_5) {
        task_ids.push(_id)
      }
    }

  })
  
  // 3. package bulk atoms
  if(task_ids.length < 1) return
  const list: BulkUpdateAtom_UploadTask[] = []
  for(let i=0; i<task_ids.length; i++) {
    const id = task_ids[i]
    const updatedStamp = now + i
    const obj: BulkUpdateAtom_UploadTask = {
      key: id,
      changes: {
        progressType: "waiting",
        updatedStamp,
      }
    }
    list.push(obj)
  }

  // 4. bulk update
  const res = await db.upload_tasks.bulkUpdate(list)
}