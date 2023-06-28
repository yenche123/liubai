import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShow, StateShow } from "~/types/types-content"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import cui from "~/components/custom-ui"
import dbOp from "../db-op"
import commonPack from "~/utils/controllers/tools/common-pack"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { SnackbarRes, SnackbarParam } from "~/types/other/types-snackbar"
import type { LiuStateConfig, LiuAtomState } from "~/types/types-atom"
import stateController from "~/utils/controllers/state-controller/state-controller"
import { i18n } from "~/locales"
import { mapStateColor } from "~/config/state-color"

interface SelectStateRes {
  tipPromise?: Promise<SnackbarRes>
  newStateId?: string
  newStateShow?: StateShow
}

interface StateCfgBackup {
  oldStateConfig?: LiuStateConfig
  backupStamp: number
}

let stateCfgBackup: StateCfgBackup | undefined

// 用户从 More 里点击 状态 后的公共逻辑
export async function selectState(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
): Promise<SelectStateRes> {
  const newThread = valTool.copyObject(oldThread) 
  const wStore = useWorkspaceStore()

  // 1. 让用户选择
  const stateIdSelected = oldThread.stateId
  const res = await cui.showStateSelector({ stateIdSelected })
  if(res.action === "mask") return {}
  if(res.action === "remove" && !stateIdSelected) return {}
  if(res.action === "confirm" && stateIdSelected === res.stateId) return {}

  // 注: thread 的操作分两步是因为 getStateShow 依赖 wStore 的变化

  // 2. 操作 thread.stateId
  let newStateId = res.stateId
  if(res.action === "confirm" && newStateId) {
    newThread.stateId = newStateId
  }
  else if(res.action === "remove") {
    delete newThread.stateId
  }

  // 3. 处理 workspace
  await handleWorkspace(wStore, newThread)

  // 4. 操作 thread.stateShow 字段
  let tmpStateShow: StateShow | undefined = undefined
  if(res.action === "confirm" && newStateId) {
    tmpStateShow = commonPack.getStateShow(newStateId, wStore)
    newThread.stateShow = tmpStateShow
  }
  else if(res.action === "remove") {
    delete newThread.stateShow
  }

  // 5. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "state")

  // 6. 修改动态的 db
  const res2 = await dbOp.setStateId(newThread._id, newStateId)

  // 7. 显示 snack-bar
  const t = i18n.global.t
  let snackParam: SnackbarParam = {
    action_key: "tip.undo"
  }
  if(newStateId && tmpStateShow) {
    let dot_color = mapStateColor("dot_color", tmpStateShow.colorShow)
    snackParam.dot_color = dot_color
    if(tmpStateShow.text) {
      snackParam.text = t("thread_related.switch_to") + tmpStateShow.text
    }
    else if(newStateId === "FINISHED") {
      snackParam.text_key = "thread_related.finished"
    }
    else {
      snackParam.text_key = "tip.updated"
    }
  }
  else {
    snackParam.text_key = "tip.removed"
  }
  const tipPromise = cui.showSnackBar(snackParam)

  return { tipPromise, newStateId, newStateShow: tmpStateShow }
}


export async function undoState(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {

  // 1. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread], "undo_collect")

  // 2. 修改 db
  const res2 = await dbOp.setStateId(oldThread._id, oldThread.stateId)

  // 3. 复原 workspace
  const wStore = useWorkspaceStore()
  await restoreStateCfg(wStore)
}


// 只修改 thread 上的 id
export async function setNewStateForThread(
  oldThread: ThreadShow,
  newStateId: string,
) {
  const wStore = useWorkspaceStore()
  const newThread = valTool.copyObject(oldThread)
  newThread.stateId = newStateId
  newThread.stateShow = commonPack.getStateShow(newStateId, wStore)

  // 1. 修改 db
  const res = await dbOp.setStateId(newThread._id, newStateId)

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "state")
  
  return true
}


async function restoreStateCfg(
  wStore: WorkspaceStore,
) {
  if(!stateCfgBackup) return
  const stateCfg = valTool.copyObject(stateCfgBackup.oldStateConfig)
  console.log("复原 stateConfig: ")
  console.log(stateCfg)
  console.log(" ")
  const res = await wStore.setStateConfig(stateCfg)
  console.log("restoreStateCfg res: ")
  console.log(res)
  console.log(" ")
  stateCfgBackup = undefined
  return true
}

async function handleWorkspace(
  wStore: WorkspaceStore,
  newThread: ThreadShow,
) {

  const { currentSpace } = wStore
  if(!currentSpace) return

  // 1. 去备份 stateConfig
  let oldStateConfig = valTool.copyObject(currentSpace.stateConfig)
  stateCfgBackup = {
    oldStateConfig,
    backupStamp: time.getTime()
  }

  // 2. 去生成 newStateConfig
  let newStateCfg: LiuStateConfig
  if(!oldStateConfig) {
    newStateCfg = stateController.getDefaultStateCfg()
  }
  else if(oldStateConfig.stateList.length < 1) {
    newStateCfg = stateController.getDefaultStateCfg()
  }
  else {
    newStateCfg = valTool.copyObject(oldStateConfig)
  }
  
  // 3. 修改 newStateConfig
  const threadId = newThread._id
  const stateId = newThread.stateId
  const { stateList, cloudStateList } = newStateCfg
  
  if(stateId) {
    // 添加到 stateList 某个 column 中
    _addState(stateList, threadId, stateId)
    if(_isUpdateCloudRequired(newThread)) {
      _addState(cloudStateList, threadId, stateId)
    }
  }
  else {
    // 凡是在 stateList[].contentIds 中看到 threadId，都把它移除掉
    _deleteState(stateList, threadId)
    if(_isUpdateCloudRequired(newThread)) {
      _deleteState(cloudStateList, threadId)
    }
  }
  newStateCfg.updatedStamp = time.getTime()

  // 4. 写入到 wStore 中
  const res = await wStore.setStateConfig(newStateCfg)
  
  return true
}

function _isUpdateCloudRequired(
  newThread: ThreadShow,
) {
  const { storageState: s } = newThread
  if(s === "CLOUD" || s === "WAIT_UPLOAD") return true
  return false
}


function _addState(
  stateList: LiuAtomState[],
  threadId: string,
  stateId: string,
) {
  for(let i=0; i<stateList.length; i++) {
    const column = stateList[i]
    if(column.id !== stateId && column.contentIds) {
      const tmpList = column.contentIds
      column.contentIds = tmpList.filter(v => v !== threadId)
    }
    else if(column.id === stateId) {
      let tmpList = column.contentIds ?? []
      tmpList = tmpList.filter(v => v !== threadId)
      tmpList.splice(0, 0, threadId)
      column.contentIds = tmpList
    }
  }
}

function _deleteState(
  stateList: LiuAtomState[],
  threadId: string,
) {
  for(let i=0; i<stateList.length; i++) {
    const column = stateList[i]
    if(column.contentIds) {
      const tmpList = column.contentIds
      column.contentIds = tmpList.filter(v => v !== threadId)
    }
  }
}