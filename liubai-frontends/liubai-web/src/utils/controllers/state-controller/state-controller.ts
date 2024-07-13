import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { LiuStateConfig, LiuAtomState } from "~/types/types-atom"
import type { AddUploadTaskOpt } from "~/utils/cloud/tools/types"
import type { TcListOption } from "../thread-controller/type"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import type { ThreadShow } from "~/types/types-content"
import cfg from "~/config"
import threadController from "../thread-controller/thread-controller"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud"

export interface GetThreadsOfAStateOpt {
  stateId: string
  excludeInKanban: boolean        // 是否排除 kanban 上的动态
  lastItemStamp?: number
}

export interface GetThreadsOfAStateRes {
  threads: ThreadShow[]
  hasMore: boolean
  excluded_ids?: string[]      // 在 state 列表里，应该被排除在外的 ids 们
  unknown_ids?: string[]       // 在 kanban 里，本应被加载出来的 ids 们，却找不到数据
}


/** 获取 "状态" 的列表 */
// 默认会有 TODO / FINISHED 两个列表
function getStates() {
  const wStore = useWorkspaceStore()
  const currentSpace = wStore.currentSpace
  if(!currentSpace) return []
  const stateCfg = currentSpace.stateConfig
  if(!stateCfg) return getSystemStates()
  if(stateCfg.stateList.length < 1) return getSystemStates()
  const list = valTool.copyObject(stateCfg.stateList)
  return list
}


/** 获取初始的两个状态列表 */
function getSystemStates() {
  const now = time.getTime()
  const defaultStates: LiuAtomState[] = [
    {
      id: "TODO",
      showInIndex: true,
      updatedStamp: now,
      insertedStamp: now,
    },
    {
      id: "FINISHED",
      showInIndex: false,
      updatedStamp: now,
      insertedStamp: now,
      showFireworks: true,
    }
  ]
  return defaultStates
}



/**
 * 去加载出某个状态下的动态
 * 业务层调用该函数，该函数会再去调用 thread-controller
 */
async function getThreadsOfAState(
  opt: GetThreadsOfAStateOpt
): Promise<GetThreadsOfAStateRes> {
  const { stateId, excludeInKanban, lastItemStamp } = opt
  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId
  const NOTHING_DATA: GetThreadsOfAStateRes = { 
    threads: [], 
    hasMore: false,
  }
  if(!spaceId) return NOTHING_DATA

  const listOpt: TcListOption = {
    viewType: "STATE",
    spaceId,
    stateId,
  }

  const stateList = getStates()
  const stateData = stateList.find(v => v.id === stateId)
  if(!stateData || !stateData.contentIds) return NOTHING_DATA
  const contentIds = stateData.contentIds

  // 不要加载看板上已有的动态
  if(excludeInKanban) {
    const tmpContentIds = valTool.copyObject(contentIds)

    // 让当前状态（看板）里第 max_kanban_thread 个
    // content 也被加载出来，让用户有承上启后的感觉
    if(tmpContentIds.length >= cfg.max_kanban_thread) {
      tmpContentIds.pop()
    }

    const limitNum = cfg.default_limit_num
    listOpt.excluded_ids = tmpContentIds
    listOpt.lastItemStamp = lastItemStamp
    listOpt.limit = limitNum
    const res = await threadController.getList(listOpt)
    return {
      threads: res,
      hasMore: res.length >= (limitNum - 1),
      excluded_ids: tmpContentIds,
    }
  }

  
  // 去加载看板上的动态
  // 这时要注意，也可能把已删除的动态加载过来，需要进行处理
  const cLength = contentIds.length
  if(!cLength) return NOTHING_DATA  
  listOpt.specific_ids = contentIds
  const res2 = await threadController.getList(listOpt)

  // 去看有没有 加载失败的动态
  const unknown_ids: string[] = []
  for(let i=0; i<contentIds.length; i++) {
    const v = contentIds[i]
    if(!res2.find(v2 => v2._id === v)) {
      unknown_ids.push(v)
    }
  }
  NOTHING_DATA.unknown_ids = unknown_ids

  for(let i=0; i<res2.length; i++) {
    const v = res2[i]
    if(v.oState !== "OK") {
      res2.splice(i, 1)
      i--
      continue
    }
  }

  if(res2.length < 1) {
    return NOTHING_DATA
  }

  let hasMore = true
  if(cLength < cfg.max_kanban_thread) {
    hasMore = false
  }

  return { 
    hasMore, 
    threads: res2,
    unknown_ids,
  }
}

// 重新排列 workspace.LiuStateConfig.stateList
async function stateListSorted(
  newStateIds: string[]
) {
  const tmpList = getStates()
  const newList: LiuAtomState[] = []
  for(let i=0; i<newStateIds.length; i++) {
    const id = newStateIds[i]
    const data = tmpList.find(v => v.id === id)
    if(data) newList.push(data)
  }

  const res = await setNewStateList(newList)
  return res
}

// 设置新的 stateList 进 stateConfig 里
async function setNewStateList(
  newList: LiuAtomState[],
  opt?: AddUploadTaskOpt,
) {
  const wStore = useWorkspaceStore()
  const currentSpace = wStore.currentSpace
  if(!currentSpace) return false
  const spaceId = wStore.spaceId
  if(!spaceId) return false

  let stateCfg = currentSpace.stateConfig
  if(!stateCfg) {
    stateCfg = getDefaultStateCfg()
  }
  const now = time.getTime()
  stateCfg.stateList = newList
  stateCfg.updatedStamp = now

  const res = await wStore.setStateConfig(stateCfg)
  LocalToCloud.addTask({
    target_id: spaceId,
    uploadTask: "workspace-state_config",
    operateStamp: now,
  }, opt)

  return res
}

/** 获取默认 stateConfig */
function getDefaultStateCfg() {
  const now = time.getTime()
  let stateList = getSystemStates()
  const obj: LiuStateConfig = {
    stateList,
    updatedStamp: now,
  }
  return obj
}


export default {
  getStates,
  getThreadsOfAState,
  getSystemStates,
  stateListSorted,
  setNewStateList,
  getDefaultStateCfg,
}

