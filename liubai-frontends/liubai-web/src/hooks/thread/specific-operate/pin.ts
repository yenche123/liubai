import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShow } from "~/types/types-content"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import limit from "~/utils/limit"
import cui from "~/components/custom-ui"
import dbOp from "../db-op"

export async function toPin(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {

  const newThread = valTool.copyObject(oldThread)

  // 1. 修改状态
  let newPin = !Boolean(oldThread.pinStamp)

  // 新的状态是置顶，去查看数目
  if(newPin) {
    const pinnedNum = await dbOp.countPin()
    const limitNum = limit.getLimit("pin")
    if(limitNum >= 0 && pinnedNum >= limitNum) {
      cui.showSnackBar({ text_key: "tip.pin_maximum", duration: 3000 })
      return {}
    }
  }


  newThread.pinStamp = newPin ? time.getTime() : 0

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "pin")

  // 3. 操作 db
  const res = await dbOp.pin(newThread, memberId, userId)

  // 4. 展示通知，并回传 promise
  const text_key = newPin ? "tip.pinned" : "tip.canceled"
  const tipPromise = cui.showSnackBar({ text_key, action_key: "tip.undo" })

  return { tipPromise, newPin }
}

export async function undoPin(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {

  // 1. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread], "undo_pin")
  
  // 2. 修改 db
  const res3 = await dbOp.pin(oldThread, memberId, userId)
}