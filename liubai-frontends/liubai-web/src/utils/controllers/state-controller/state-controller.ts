import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { LiuAtomState } from "~/types/types-atom"
import type { TcListOption } from "../thread-controller/type"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import { ThreadShow } from "~/types/types-content"
import cfg from "~/config"
import threadController from "../thread-controller/thread-controller"

export interface GetThreadsOfAStateOpt {
  stateId: string
  excludeInKanban?: boolean        // 是否排除 kanban 上的动态
  lastItemStamp?: number
}

export interface GetThreadsOfAStateRes {
  threads: ThreadShow[]
  hasMore: boolean
}


/** 获取 "状态" 的列表 */
// 默认会有 TODO / FINISHED 两个列表
function getStates() {
  const wStore = useWorkspaceStore()
  const currentSpace = wStore.currentSpace
  if(!currentSpace) return []
  const stateCfg = currentSpace.stateConfig
  if(!stateCfg) return _getSystemStates()
  if(stateCfg.stateList.length < 1) return _getSystemStates()
  const list = valTool.copyObject(stateCfg.stateList)
  return list
}


function _getSystemStates() {
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
    }
  ]
  return defaultStates
}



// 业务层调用该函数，该函数会再去调用 thread-controller
async function getThreadsOfAThread(
  opt: GetThreadsOfAStateOpt
): Promise<GetThreadsOfAStateRes> {
  const { stateId, excludeInKanban, lastItemStamp } = opt
  const wStore = useWorkspaceStore()
  const workspace = wStore.workspace
  const nothingData = { threads: [], hasMore: false }
  if(!workspace) return nothingData

  const listOpt: TcListOption = {
    viewType: "STATE",
    workspace,
    stateId,
  }

  const states = getStates()
  const stateData = states.find(v => v.id === stateId)
  if(!stateData || !stateData.contentIds) return nothingData
  const contentIds = stateData.contentIds

  // 不要加载看板上已有的动态
  if(excludeInKanban) {
    const tmpContentIds = valTool.copyObject(contentIds)
    if(tmpContentIds.length > cfg.max_kanban_thread) {
      tmpContentIds.pop()
    }
    const limitNum = 16
    listOpt.excludeIds = tmpContentIds
    listOpt.lastItemStamp = lastItemStamp
    listOpt.limit = limitNum
    const res = await threadController.getList(listOpt)
    return {
      threads: res,
      hasMore: res.length >= limitNum,
    }
  }

  
  // 去加载看板上的动态
  // 这时要注意，也可能把已删除的动态加载过来，需要进行处理
  const cLength = contentIds.length
  if(!cLength) return nothingData  
  listOpt.ids = contentIds
  const res2 = await threadController.getList(listOpt)

  for(let i=0; i<res2.length; i++) {
    const v = res2[i]
    if(v.oState !== "OK") {
      res2.splice(i, 1)
      i--
      continue
    }
  }

  if(res2.length < 1) {
    return nothingData
  }

  let hasMore = true
  if(contentIds.length < cfg.max_kanban_thread) {
    hasMore = false
  }
  else {
    // contentIds 大于 16 个元素时
    const lastId = contentIds[cLength - 1]
    const newLastId = res2[res2.length - 1]._id
    if(lastId === newLastId) {
      res2.pop()
    }
  }

  return { hasMore, threads: res2 }
}


export default {
  getStates,
  getThreadsOfAThread,
}

