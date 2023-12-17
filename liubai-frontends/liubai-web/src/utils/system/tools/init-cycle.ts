// 整个网页启动后
// 并且等待 route.name 有值，且在 "应用内"（即 inApp 不为 false）时
// 执行一些系统操作：
// 1. 将 DELETED 的 contents 都给删除
// 2. 将超过 30 天且为 REMOVED 的 contents 调整为 DELETED

// 删除完后，不需要用 useThreadShowStore 通知各组件
// 因为各组件都不应显示出过期并且已删除的数据

import { useEnterIntoApp } from "~/hooks/useEnterIntoApp";
import time from "~/utils/basic/time";
import valTool from "~/utils/basic/val-tool";
import { db } from "~/utils/db";
import { 
  deleteThreadsFromWorkspaceStateCfg 
} from "~/hooks/thread/specific-operate/delete-related"

export function initCycle() {

  useEnterIntoApp(async () => {
    console.log("useEnterIntoApp fn.........")

    // 等个 2500 ms 再去处理这些背景操作
    await valTool.waitMilli(2500)

    await handleDeletedContents()
    await handleRemovedContents()

  })

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