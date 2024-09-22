import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShow } from "~/types/types-content"
import time from "~/utils/basic/time"
import limit from "~/utils/limit"
import cui from "~/components/custom-ui"
import dbOp from "../db-op"
import { type ThreadChangedOpt } from "~/types/types-atom"
import liuUtil from "~/utils/liu-util"

//【重要】
// 应该先 “修改 db”，再去 “通知全局”
// 因为通知全局时，可能会触发 “刷新”，这个时候若数据库还没更新，
// 会加载到旧的数据 

export async function toPin(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
  opt?: ThreadChangedOpt,
) {

  const newThread = liuUtil.copy.newData(oldThread)

  // 1. 修改状态
  let newPin = !Boolean(oldThread.pinStamp)

  // 2. 新的状态是置顶，去查看数目
  // 若已达最大值，提示用户 pin_maximum
  if(newPin) {
    const pinnedNum = await dbOp.countPin(oldThread.spaceId)
    const limitNum = limit.getLimit("pin")
    if(limitNum >= 0 && pinnedNum >= limitNum) {
      cui.showSnackBar({ text_key: "tip.pin_maximum", duration: 3000 })
      return {}
    }
  }

  newThread.pinStamp = newPin ? time.getTime() : 0

  // 3. 操作 db
  const res = await dbOp.pin(newThread, memberId, userId)

  // 4. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "pin", opt)

  // 5. 展示通知，并回传 promise
  const text_key = newPin ? "tip.pinned" : "tip.canceled"
  const tipPromise = cui.showSnackBar({ text_key, action_key: "tip.undo" })

  return { tipPromise, newPin }
}

export async function undoPin(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {
  // 1. 修改 db
  const res3 = await dbOp.pin(oldThread, memberId, userId, true)

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread], "undo_pin")
}