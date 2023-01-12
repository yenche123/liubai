import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShow } from "~/types/types-content"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import cui from "../../../custom-ui"
import dbOp from "../db-op"

// 处理动态 "收藏" 的公共逻辑
export const toCollect = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {
  const newThread = valTool.copyObject(oldThread)

  // 1. 修改状态
  let newFavorite = !Boolean(oldThread.myFavorite)
  newThread.myFavorite = newFavorite
  newThread.myFavoriteStamp = time.getTime()

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread])

  // 3. 操作 db
  const res = await dbOp.collect(newThread, memberId, userId)

  // 4. 展示通知，并回传 promise
  const text_key = newFavorite ? "tip.collected" : "tip.canceled"
  const tipPromise = cui.showSnackBar({ text_key, action_key: "tip.undo" })

  // 5. 【待完善】将该操作塞入远端待同步的队列

  return { tipPromise, newFavorite }
}

export const undoCollect = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {

  // 1. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread])

  // 2. 修改 db
  const res3 = await dbOp.collect(oldThread, memberId, userId)

  // 3. 【待完善】将取消操作塞入远端待同步的队列
  
}