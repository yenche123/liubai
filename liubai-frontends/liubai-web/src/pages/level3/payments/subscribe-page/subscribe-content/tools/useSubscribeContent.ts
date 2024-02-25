import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import { type ScData } from "./types"
import { onActivated, onDeactivated, reactive, ref, watch } from "vue"
import liuEnv from "~/utils/liu-env"
import { CloudEventBus } from "~/utils/cloud/CloudEventBus"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import { type Res_UserSettings_Membership } from "~/requests/req-types"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import type { 
  UserSubscription,
} from "~/types/types-cloud"

let timeout: LiuTimeout

export function useSubscribeContent() {

  const hasBackend = liuEnv.hasBackend()
  const now = time.getTime()
  const scData = reactive<ScData>({
    status: hasBackend ? 1 : 0,
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

  if(scData.status === 1) return

  const isActivated = ref(false)
  onActivated(() => isActivated.value = true)
  onDeactivated(() => isActivated.value = false)

  // listen to syncNum
  const syncNum = CloudEventBus.getSyncNum()
  watch([syncNum, isActivated], (
    [newV1, newV2]
  ) => {
    if(newV1 < 1) return
    if(!newV2) return
    checkState(scData)
  }, { immediate: true })

  // set delay to check if the status is greater than 0
  timeout = setTimeout(() => {
    if(scData.status > 0) return
    scData.status = 4
    closeLoading(scData)
  }, 5000)
}

async function checkState(
  scData: ScData,
) {
  console.log("checkState.........")
  const user = await CloudEventBus.getUserFromDB()
  if(!user) return

  // 1. check stripe customer portal created is within 24 hrs
  const sub = user.subscription
  const c1 = sub?.stripe?.customer_portal_created ?? 1
  const c2 = sub?.stripe?.customer_portal_url
  const diff = time.getTime() - (c1 * 1000)
  if(sub?.isOn === "Y" && diff < time.DAY && c2) {
    checkSubscription(scData, sub)
    closeLoading(scData)
    return
  }

  // 2. get latest subscription
  getLatestSubscription(scData)
}

async function getLatestSubscription(
  scData: ScData,
) {
  // get latest subscription remotely
  const url = APIs.USER_MEMBERSHIP
  const param = { operateType: "membership" }
  let sub: UserSubscription | undefined
  try {
    const res = await liuReq.request<Res_UserSettings_Membership>(url, param)
    if(res.code === "0000" && res.data) {
      sub = res.data.subscription
    }
    else {

    }
  }
  catch(err) {
    console.log("getLatestSubscription err: ")
    console.log(err)
    console.log(" ")
    scData.status = 4
    closeLoading(scData)
    return
  }

  if(!sub || sub.isOn === "N") {
    scData.status = 2
    closeLoading(scData)
    return
  }

  checkSubscription(scData, sub)
  closeLoading(scData)
}


function checkSubscription(
  scData: ScData,
  sub: UserSubscription,
) {

}




async function closeLoading(
  scData: ScData,
) {
  if(timeout) {
    clearTimeout(timeout)
    timeout = undefined
  }

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
