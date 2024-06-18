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
import type { 
  LiuStateConfig, 
  LiuAtomState,
} from "~/types/types-atom"
import stateController from "~/utils/controllers/state-controller/state-controller"
import { i18n } from "~/locales"
import { mapStateColor } from "~/config/state-color"
import cfg from "~/config"
import cloudOp from "../cloud-op"

interface SelectStateRes {
  tipPromise?: Promise<SnackbarRes>
  newStateId?: string
  newStateShow?: StateShow
}

interface FloatUpRes {
  tipPromise?: Promise<SnackbarRes>
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
  const workspace_id = await handleWorkspace(wStore, newThread)
  if(!workspace_id) return {}

  // 4. 操作 thread.stateShow 字段
  let tmpStateShow: StateShow | undefined = undefined
  if(res.action === "confirm" && newStateId) {
    tmpStateShow = commonPack.getStateShow(newStateId, wStore)
    newThread.stateShow = tmpStateShow
  }
  else if(res.action === "remove") {
    delete newThread.stateShow
  }

  // 5. 修改动态的 db
  const operateStamp = await dbOp.setStateId(newThread._id, newStateId)

  // 6. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "state")

  // 7. upload
  cloudOp.saveContentToCloud(newThread, operateStamp)
  cloudOp.saveWorkspaceToCloud(workspace_id)

  // 8. 显示 snack-bar
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

// 撤回状态的修改
export async function undoState(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {

  // 1. 修改 db
  const operateStamp = await dbOp.setStateId(oldThread._id, oldThread.stateId)

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread], "undo_collect")

  // 3. 复原 workspace
  const wStore = useWorkspaceStore()
  const workspace_id = await restoreStateCfg(wStore)
  if(!workspace_id) return

  // 4. upload
  cloudOp.saveContentToCloud(oldThread, operateStamp, true)
  cloudOp.saveWorkspaceToCloud(workspace_id, true)
}

// 浮上去
export async function floatUp(
  thread: ThreadShow,
  memberId: string,
  userId: string,
): Promise<FloatUpRes> {
  const stateId = thread.stateId
  if(!stateId) return {}

  const wStore = useWorkspaceStore()

  // 1. 直接处理 workspace 即可
  const workspace_id = await handleWorkspace(wStore, thread)
  if(!workspace_id) return {}

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([thread], "float_up")

  // 3. upload
  cloudOp.saveWorkspaceToCloud(workspace_id)

  // 4. 显示 snackbar
  const text_key = "state_related.bubbled"
  const action_key = "tip.undo"
  const tipPromise = cui.showSnackBar({ text_key, action_key })

  return { tipPromise }
}

// 撤回冒泡
export async function undoFloatUp(
  thread: ThreadShow,
  memberId: string,
  userId: string,
) {
  // 1. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([thread], "undo_float_up")

  // 2. 复原 workspace
  const wStore = useWorkspaceStore()
  const workspace_id = await restoreStateCfg(wStore)
  if(!workspace_id) return

  // 3. upload
  cloudOp.saveWorkspaceToCloud(workspace_id, true)
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
  const operateStamp = await dbOp.setStateId(newThread._id, newStateId)

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "state")

  // 3. upload
  cloudOp.saveContentToCloud(newThread, operateStamp)
  
  return true
}


async function restoreStateCfg(
  wStore: WorkspaceStore,
) {
  const spaceId = wStore.spaceId
  if(!spaceId || !stateCfgBackup) return
  const stateCfg = valTool.copyObject(stateCfgBackup.oldStateConfig)
  const res = await wStore.setStateConfig(stateCfg)
  stateCfgBackup = undefined
  return spaceId
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
  const { stateList } = newStateCfg
  
  if(stateId) {
    // 添加到 stateList 某个 column 中
    _addState(stateList, threadId, stateId)
  }
  else {
    // 凡是在 stateList[].contentIds 中看到 threadId，都把它移除掉
    _deleteState(stateList, threadId)
  }
  newStateCfg.updatedStamp = time.getTime()

  // 4. 写入到 wStore 中
  const res = await wStore.setStateConfig(newStateCfg)
  
  return currentSpace._id
}

function _addState(
  stateList: LiuAtomState[],
  threadId: string,
  stateId: string,
) {
  const MAX_NUM = cfg.max_kanban_thread

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

    const cLen = column.contentIds?.length ?? 0
    if(cLen > MAX_NUM) {
      const deleteNum = cLen - MAX_NUM
      column.contentIds?.splice(MAX_NUM, deleteNum)
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
