import { watch, reactive } from "vue";
import threadController from "~/utils/controllers/thread-controller/thread-controller";
import type { TdData, TdProps, TdEmit } from "./types"

export function useThreadDetail(props: TdProps, emit: TdEmit) {

  const tdData = reactive<TdData>({
    state: 0,
    threadShow: undefined,
  })
  watch(() => tdData.state, (newV) => {
    emit("pagestatechange", newV)
  })

  watch(() => props.threadId, (newV) => {
    whenThreadIdChange(newV, tdData)
  }, { immediate: true })

  return {
    tdData,
  }
}


function whenThreadIdChange(
  newId: string,
  tdData: TdData,
) {
  console.log("whenThreadIdChange........")
  if(_hasLoaded(newId, tdData)) return
  console.log("toLoad..............")
  console.log(" ")
  toLoad(newId, tdData)
}

function _hasLoaded(
  id: string,
  tdData: TdData,
) {
  const thread = tdData.threadShow
  if(!thread) return false
  if(thread._id === id) return true
  return false
}


function toLoad(
  id: string,
  tdData: TdData
) {
  if(tdData.threadShow) tdData.state = 1
  else tdData.state = 0

  loadLocal(id, tdData)
}


/**
 * 本地加载 thread
 */
async function loadLocal(
  id: string,
  tdData: TdData
) {
  const res = await threadController.getData({ id })
  // await valTool.waitMilli(1500)
  if(res && res.oState === "OK") {
    tdData.state = -1
    tdData.threadShow = res
  }
  else {
    // 这个 else 分支，loadRemote 实现后，必须删掉
    tdData.state = 50
  }

  loadRemote(id, tdData)
}

/**
 * 远端加载 thread
 */
async function loadRemote(
  id: string,
  tdData: TdData
) {
  // 待完善

  const tShow = tdData.threadShow
  const tState = tdData.state

  
  
  
}
