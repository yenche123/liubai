import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShow } from "~/types/types-content"
import time from "~/utils/basic/time"
import liuApi from "~/utils/liu-api"
import cui from "~/components/custom-ui"
import dbOp from "../db-op"
import liuUtil from "~/utils/liu-util"

// 处理动态 "收藏" 的公共逻辑
export const toCollect = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {
  const newThread = liuUtil.copy.newData(oldThread)

  // 1. 修改状态
  let newFavorite = !Boolean(oldThread.myFavorite)
  newThread.myFavorite = newFavorite
  newThread.myFavoriteStamp = time.getTime()

  // 2. 操作 db & cloud
  const res = await dbOp.collect(newThread, memberId, userId)

  // 3. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "collect")

  // 4. 展示通知，并回传 promise
  const text_key = newFavorite ? "tip.collected" : "tip.canceled"
  const tipPromise = cui.showSnackBar({ text_key, action_key: "tip.undo" })

  // 5. 震动
  const vib = liuApi.vibrate([50])

  return { tipPromise, newFavorite }
}

export const undoCollect = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {

  // 1. 修改 db & cloud
  const res3 = await dbOp.collect(oldThread, memberId, userId, true)

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread], "undo_collect")
  
}