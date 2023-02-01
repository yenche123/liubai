import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShow } from "~/types/types-content"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import liuApi from "~/utils/liu-api"
import cui from "../../../custom-ui"
import dbOp from "../db-op"
import commonPack from "~/utils/controllers/tools/common-pack"
import { useWorkspaceStore, WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { SnackbarRes } from "~/types/other/types-snackbar"
import type { LiuStateConfig, LiuAtomState } from "~/types/types-atom"
import stateController from "~/utils/controllers/state-controller/state-controller"

interface SelectStateRes {
  tipPromise?: Promise<SnackbarRes>
  newStateId?: string
}

interface StateCfgBackup {
  oldStateConfig?: LiuStateConfig
  backupStamp: number
}

let stateCfgBackup: StateCfgBackup

// 处理动态 状态 的公共逻辑
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

  let res2: SelectStateRes = {}

  // 2. 操作 thread
  let newStateId = res.stateId
  if(res.action === "confirm" && newStateId) {
    newThread.stateId = newStateId
    newThread.stateShow = commonPack.getStateShow(newStateId, wStore)
  }
  else if(res.action === "remove") {
    delete newThread.stateId
    delete newThread.stateShow
  }

  // 3. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "state")

  // 4. 修改动态的 db
  const res3 = await dbOp.setState(newThread._id, newStateId)

  // 5. 处理 workspace
  handleWorkspace(wStore, newThread)
  

  return res2
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
    newStateCfg = getDefaultStateCfg()
  }
  else if(oldStateConfig.stateList.length < 1) {
    newStateCfg = getDefaultStateCfg()
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

function getDefaultStateCfg() {
  const now = time.getTime()
  let stateList = stateController.getSystemStates()
  const obj: LiuStateConfig = {
    stateList,
    cloudStateList: valTool.copyObject(stateList),
    updatedStamp: now,
    cloudUpdatedStamp: now,
  }
  return obj
}



// 【严重问题】需要考虑 动态本身的 storageState 这样才知道是否要修改到远端......
// 要考虑怎么修改远端的 workspace.stateConfig
function setNewStateId(
  newThread: ThreadShow,
  newStateId: string,
) {

}