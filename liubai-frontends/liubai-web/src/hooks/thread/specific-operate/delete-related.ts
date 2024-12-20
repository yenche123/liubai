import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShow } from "~/types/types-content"
import cui from "~/components/custom-ui"
import dbOp from "../db-op"
import time from "~/utils/basic/time"
import stateController from "~/utils/controllers/state-controller/state-controller"
import liuUtil from "~/utils/liu-util"

export async function deleteThread(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {
  const newThread = liuUtil.copy.newData(oldThread)
  const now = time.getTime()

  // 1. 修改数据
  newThread.oState = "REMOVED"
  newThread.updatedStamp = now
  newThread.removedStamp = now
  newThread.removedStr = liuUtil.showBasicTime(now)

  // 2. 操作 db
  const res = await dbOp.setOState(newThread, "thread-delete")

  // 3. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "delete")

  // 4. 展示通知 回传 promise
  const tipPromise = cui.showSnackBar({ text_key: "tip.deleted", action_key: "tip.undo" })

  return { tipPromise }
}

export async function restoreThread(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {
  const newThread = liuUtil.copy.newData(oldThread)

  // 1. 修改数据
  newThread.oState = "OK"
  newThread.updatedStamp = time.getTime()
  delete newThread.removedStamp
  delete newThread.removedStr

  // 2. 操作 db
  const res = await dbOp.setOState(newThread, "thread-restore")

  // 3. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "restore")

  // 4. 展示通知
  cui.showSnackBar({ text_key: "tip.restored" })

  return true
}

export async function undoDelete(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {
  // 1. 修改 db
  const res = await dbOp.setOState(oldThread, "undo_thread-delete")

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread], "undo_delete")
}

export async function deleteForever(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {

  const res = await cui.showModal({
    title_key: "thread_related.delete_forever_1",
    content_key: "thread_related.delete_forever_2",
    confirm_key: "thread_related.delete_btn",
    modalType: "warning",
  })
  if(!res.confirm) return false

  const newThread = liuUtil.copy.newData(oldThread)

  // 1. 修改数据
  newThread.oState = "DELETED"
  newThread.updatedStamp = time.getTime()

  // 2. 检查 workspace.stateConfig
  await deleteThreadsFromWorkspaceStateCfg([newThread._id])

  // 3. 操作 db
  const res2 = await dbOp.deleteForever(newThread._id)

  // 4. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "delete_forever")
  
  return true
}


/**
 * 检查各个工作区里的 “状态” 
 * 确认是否具备这些被删除的动态，若有，去从看板中移除
 */
export async function deleteThreadsFromWorkspaceStateCfg(
  threadIds: string[]
) {
  const stateList = stateController.getStates()
  if(stateList.length < 1) return true

  let hasFound = false
  for(let i=0; i<stateList.length; i++) {
    const v = stateList[i]
    const { contentIds } = v
    if(!contentIds) continue
    threadIds.forEach(v2 => {
      const idx = contentIds.indexOf(v2)
      if(idx < 0) return
      hasFound = true
      contentIds.splice(idx, 1)
    })
  }

  if(!hasFound) return true

  const res = await stateController.setNewStateList(stateList)
  return true
}