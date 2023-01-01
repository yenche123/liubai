import { useThreadShowStore } from "../../../../hooks/stores/useThreadShowStore"
import type { ThreadShow } from "../../../../types/types-content"
import valTool from "../../../../utils/basic/val-tool"
import cui from "../../../custom-ui"
import dbOp from "../db-op"
import soTool from "./tools/so-tool"

export const setWhen = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {
  const newThread = valTool.copyObject(oldThread)

}

export const setRemind = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {
  const newThread = valTool.copyObject(oldThread)

}

export const clearWhen = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {
  const newThread = valTool.copyObject(oldThread)

  // 1. 修改状态
  delete newThread.whenStamp
  if(newThread.remindMe?.type === "early") {
    delete newThread.remindMe
    delete newThread.remindStamp
  }
  soTool.setEdit(newThread)

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread])

  // 3. 操作 db
  const res = await dbOp.editWhenRemind(newThread, memberId, userId)

  // 4. 展示通知 回传 promise
  const tipPromise = cui.showSnackBar({ text_key: "tip.removed", action_key: "tip.undo" })

  return { tipPromise }
}

export const clearRemind = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {
  const newThread = valTool.copyObject(oldThread)

  // 1. 修改状态
  delete newThread.remindMe
  delete newThread.remindStamp
  soTool.setEdit(newThread)

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread])

  // 3. 操作 db
  const res = await dbOp.editWhenRemind(newThread, memberId, userId)

  // 4. 展示通知 回传 promise
  const tipPromise = cui.showSnackBar({ text_key: "tip.removed", action_key: "tip.undo" })

  return { tipPromise }
}

export const undoWhenRemind = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {

  // 1. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread])

  // 2. 修改 db
  const res = await dbOp.editWhenRemind(oldThread, memberId, userId)
}