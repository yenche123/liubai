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
import type { PageState } from "~/types/types-atom"
import { useNetwork } from "~/hooks/useVueUse"

let timeout: LiuTimeout

export function useSubscribeContent() {

  const hasBackend = liuEnv.hasBackend()
  const now = time.getTime()
  const scData = reactive<ScData>({
    state: hasBackend ? 0 : 53,
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

  if(scData.state === 53) return

  const isActivated = ref(false)
  onActivated(() => isActivated.value = true)
  onDeactivated(() => isActivated.value = false)

  // 1. listen to syncNum
  const syncNum = CloudEventBus.getSyncNum()
  watch([syncNum, isActivated], (
    [newV1, newV2]
  ) => {
    if(newV1 < 1) return
    if(!newV2) return
    checkState(scData)
  }, { immediate: true })

  // 2. if no network while init
  const { isOnline } = useNetwork()
  if(!isOnline.value) {
    setDataState(scData, 52)
  }

  // set delay to check if the status is greater than 0
  timeout = setTimeout(() => {
    if(scData.state !== 0) return
    setDataState(scData, 52)
  }, 5 * time.SECONED)
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
    return
  }

  // 2. get latest my membership
  getLatestMembership(scData)
}

async function getLatestMembership(
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
    console.log("getLatestMembership err: ")
    console.log(err)
    console.log(" ")
    setDataState(scData, 52)
    return
  }

  if(!sub || sub.isOn === "N") {
    scData.state = -1
    setDataState(scData, -1)
    return
  }

  checkSubscription(scData, sub)
}

// get latest subscription plan
async function getSubscriptionPlan() {
  
}


function checkSubscription(
  scData: ScData,
  sub: UserSubscription,
) {

}




async function setDataState(
  scData: ScData,
  state: PageState,
) {
  if(timeout) {
    clearTimeout(timeout)
    timeout = undefined
  }

  const now = time.getTime()
  const diff = now - scData.initStamp
  if(diff > 300) {
    scData.state = state
    return
  }
  const ms = 400 - diff
  await valTool.waitMilli(ms)
  scData.state = state
}
