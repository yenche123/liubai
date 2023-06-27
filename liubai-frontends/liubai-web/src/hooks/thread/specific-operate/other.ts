import type { ThreadShow } from "~/types/types-content"
import dbOp from "../db-op"
import valTool from "~/utils/basic/val-tool"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import cui from "~/components/custom-ui"

export async function setShowCountdown(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {
  const newThread = valTool.copyObject(oldThread)

  // 1. 修改数据
  const cCfg = newThread.config ?? {}
  cCfg.showCountdown = cCfg.showCountdown === false ? true : false
  newThread.config = cCfg

  // 2. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "hourglass")

  // 3. 操作 db
  const res = await dbOp.setContentConfig(newThread._id, cCfg)

  // 4. 展示通知，并回传 promise
  const res2 = await cui.showSnackBar({ text_key: "tip.updated", action_key: "tip.undo" })
  if(res2.result !== "tap") return

  // 发生撤销
  // 5. 通知到全局
  tsStore.setUpdatedThreadShows([oldThread], "hourglass")

  // 6. 修改 db
  const res3 = await dbOp.setContentConfig(newThread._id, oldThread.config)
}