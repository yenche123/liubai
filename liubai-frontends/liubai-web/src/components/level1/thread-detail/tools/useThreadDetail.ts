import { watch, reactive, onActivated } from "vue";
import threadController from "~/utils/controllers/thread-controller/thread-controller";
import type { TdData, TdProps, TdEmit, TdCtx } from "./types"
import valTool from "~/utils/basic/val-tool";
import type { LiuTimeout } from "~/utils/basic/type-tool";

export function useThreadDetail(props: TdProps, emit: TdEmit) {

  const tdData = reactive<TdData>({
    state: 0,
    threadShow: undefined,
    focusNum: 0,
  })

  const ctx: TdCtx = {
    id: "",
    tdData,
    emit,
  }

  watch(() => tdData.state, (newV) => {
    emit("pagestatechange", newV)
  })

  watch(() => props.threadId, (newV) => {
    ctx.id = newV
    whenThreadIdChange(ctx)
  }, { immediate: true })

  onActivated(() => {
    const _thread = tdData.threadShow
    if(!_thread) return
    emitThreadShow(ctx)
  })


  const onRequestFocus = () => {
    tdData.focusNum++
  }

  return {
    tdData,
    onRequestFocus,
  }
}


let emitTimeout: LiuTimeout
function emitThreadShow(
  ctx: TdCtx,
  instantly: boolean = false,
) {
  if(emitTimeout) clearTimeout(emitTimeout)
  const ms = instantly ? 0 : 150
  emitTimeout = setTimeout(() => {
    emitTimeout = undefined
    const _thread = ctx.tdData.threadShow
    if(!_thread) return
    const thread = valTool.copyObject(_thread)
    ctx.emit("getthreadshow", thread)
  }, ms)
}


function whenThreadIdChange(
  ctx: TdCtx,
) {
  if(_hasLoaded(ctx.id, ctx.tdData)) {
    emitThreadShow(ctx)
    return
  }

  toLoad(ctx)
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
  ctx: TdCtx
) {
  const { tdData } = ctx
  if(tdData.threadShow) tdData.state = 1
  else tdData.state = 0

  loadLocal(ctx)
}


/**
 * 本地加载 thread
 */
async function loadLocal(
  ctx: TdCtx
) {
  const { id, tdData } = ctx
  const res = await threadController.getData({ id })
  // await valTool.waitMilli(1500)
  if(res && res.oState === "OK") {
    tdData.state = -1
    tdData.threadShow = res
    emitThreadShow(ctx, true)
  }
  else {
    // 这个 else 分支，loadRemote 实现后，必须删掉
    tdData.state = 50
  }

  loadRemote(ctx)
}

/**
 * 远端加载 thread
 */
async function loadRemote(
  ctx: TdCtx
) {
  // 待完善

  const { id, tdData } = ctx
  const tShow = tdData.threadShow
  const tState = tdData.state

  
  
  
}
