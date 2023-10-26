import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShow } from "~/types/types-content"
import valTool from "~/utils/basic/val-tool"
import liuUtil from "~/utils/liu-util"
import cui from "~/components/custom-ui"
import dbOp from "../db-op"
import soTool from "./tools/so-tool"
import time from "~/utils/basic/time"
import { REMIND_EARLY, REMIND_LATER } from "~/config/atom"

// 处理设置动态的 "什么时候" 和 "提醒我" 的公共逻辑

export const setWhen = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {
  const newThread = valTool.copyObject(oldThread)
  const { whenStamp } = newThread
  if(!whenStamp) return

  // 1. 显示 date-picker
  const res = await cui.showDatePicker({ date: new Date(whenStamp) })
  if(!res.confirm || !res.date) return

  // 2. 将新的数据装到 newThread 里
  newThread.whenStamp = res.date.getTime()
  soTool.setEdit(newThread)

  // 3. 操作 db
  const res2 = await dbOp.editWhenRemind(newThread, memberId, userId)

  // 4. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "edit")

  // 5. 展示通知 回传 promise
  const tipPromise = cui.showSnackBar({ text_key: "tip.updated", action_key: "tip.undo" })

  return { tipPromise }
}

export const setRemind = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {
  const newThread = valTool.copyObject(oldThread)
  const { remindMe, whenStamp } = newThread
  if(!remindMe) return

  // 1. 展示 actionsheet
  const hasWhen = Boolean(whenStamp)
  const itemList = liuUtil.getRemindMenu(hasWhen)
  const res = await cui.showActionSheet({ itemList, title_key: "editor.remind" })
  if(res.result !== "option" || typeof res.tapIndex === "undefined") return

  // 2. 开始想办法赋值新数据
  const idx = res.tapIndex
  let newRemindStamp = newThread.remindStamp
  let newRemindMe = newThread.remindMe
  const now = time.getTime()

  if(!hasWhen) {
    const v = REMIND_LATER[idx]
    if(v === "other") {
      let tmpStamp = newRemindStamp && newRemindStamp > now ? newRemindStamp : undefined
      let tmpDate = tmpStamp ? new Date(tmpStamp) : undefined
      const res2 = await cui.showDatePicker({ date: tmpDate })
      if(!res2.confirm || !res2.date) return
      newRemindStamp = res2.date.getTime()
      newRemindMe = {
        type: "specific_time",
        specific_stamp: newRemindStamp
      }
    }
    else {
      newRemindStamp = liuUtil.getLaterStamp(v)
      newRemindMe = {
        type: "specific_time",
        specific_stamp: newRemindStamp
      }
    }
  }
  else {
    const v = REMIND_EARLY[idx]
    newRemindStamp = liuUtil.getEarlyStamp(whenStamp as number, v)
    newRemindMe = {
      type: "early",
      early_minute: v
    }
  }

  newThread.remindMe = newRemindMe
  newThread.remindStamp = newRemindStamp
  soTool.setEdit(newThread)

  // 3. 操作 db
  const res2 = await dbOp.editWhenRemind(newThread, memberId, userId)

  // 4. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "edit")

  // 5. 展示通知 回传 promise
  const tipPromise = cui.showSnackBar({ text_key: "tip.updated", action_key: "tip.undo" })

  return { tipPromise }
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

  // 2. 操作 db
  const res = await dbOp.editWhenRemind(newThread, memberId, userId)

  // 3. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "edit")

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

  // 2. 操作 db
  const res = await dbOp.editWhenRemind(newThread, memberId, userId)

  // 3. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "edit")

  // 4. 展示通知 回传 promise
  const tipPromise = cui.showSnackBar({ text_key: "tip.removed", action_key: "tip.undo" })

  return { tipPromise }
}

export const undoWhenRemind = async (
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) => {
  // 1. 修改 db
  const res = await dbOp.editWhenRemind(oldThread, memberId, userId)

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread], "edit")  
}