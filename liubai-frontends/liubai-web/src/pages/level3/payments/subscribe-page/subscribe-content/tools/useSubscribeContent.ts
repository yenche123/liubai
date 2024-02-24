import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import { type ScData } from "./types"
import { reactive, watch } from "vue"
import liuEnv from "~/utils/liu-env"
import { CloudEventBus } from "~/utils/cloud/CloudEventBus"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"


export function useSubscribeContent() {

  const hasBackend = liuEnv.hasBackend()
  const now = time.getTime()
  const scData = reactive<ScData>({
    hasBackend,
    loading: hasBackend,
    initStamp: now,
  })

  initSubscribeContent(scData)

  return {
    scData  
  }
}


function initSubscribeContent(
  scData: ScData,
) {

  if(!scData.hasBackend) return

  // listen to syncNum
  const syncNum = CloudEventBus.getSyncNum()
  watch(syncNum, (newV) => {
    if(newV < 1) return
    checkState(scData)
  }, { immediate: true })
}

async function checkState(
  scData: ScData,
) {
  console.log("checkState.........")

  
}


async function closeLoading(
  scData: ScData,
) {
  const now = time.getTime()
  const diff = now - scData.initStamp
  if(diff > 300) {
    scData.loading = false
    return
  }
  const ms = 400 - diff
  await valTool.waitMilli(ms)
  scData.loading = true
}
