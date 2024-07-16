import { watch, reactive, onActivated } from "vue";
import threadController from "~/utils/controllers/thread-controller/thread-controller";
import type { TdData, TdProps, TdEmit, TdCtx } from "./types";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import liuEnv from "~/utils/liu-env";
import { CloudMerger } from "~/utils/cloud/CloudMerger";
import type { SyncGet_ThreadData } from "~/types/cloud/sync-get/types";
import liuUtil from "~/utils/liu-util";

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
    const thread = liuUtil.copy.newData(_thread)
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
  ctx: TdCtx,
) {
  const { id, tdData } = ctx
  const res = await threadController.getData({ id })
  if(res && res.oState === "OK") {
    tdData.state = -1
    tdData.threadShow = res
    emitThreadShow(ctx, true)
  }

  loadRemote(ctx)
}

/**
 * 远端加载 thread
 */
async function loadRemote(
  ctx: TdCtx
) {
  const { id, tdData } = ctx

  // 1. can i sync
  const res1 = liuEnv.canISync()
  if(!res1) {
    if(tdData.state !== -1) {
      tdData.state = 50
    }
    return
  }

  // 2. sync
  const opt: SyncGet_ThreadData = {
    taskType: "thread_data",
    id,
  }
  const res2 = await CloudMerger.request(opt, { maxStackNum: 2 })

  // 3. load locally again
  const res3 = await threadController.getData({ id })
  if(res3 && res3.oState === "OK") {
    tdData.state = -1
    tdData.threadShow = res3
    emitThreadShow(ctx, true)
  }
  else {
    tdData.state = 50
  }
  
}
