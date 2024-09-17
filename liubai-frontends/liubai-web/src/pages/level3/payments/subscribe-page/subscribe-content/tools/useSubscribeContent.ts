import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import { type ScData } from "./types"
import { reactive, watch } from "vue"
import liuEnv from "~/utils/liu-env"
import { CloudEventBus } from "~/utils/cloud/CloudEventBus"
import time from "~/utils/basic/time"
import type {
  Res_UserSettings_Membership,
  Res_SubPlan_Info,
  Res_SubPlan_StripeCheckout,
  Param_PaymentOrder_A,
  Res_PO_CreateOrder,
} from "~/requests/req-types"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import type { 
  UserSubscription,
} from "~/types/types-cloud"
import type { PageState } from "~/types/types-atom"
import { pageStates } from "~/utils/atom"
import { useNetwork } from "~/hooks/useVueUse"
import liuUtil from "~/utils/liu-util"
import { db } from "~/utils/db"
import localCache from "~/utils/system/local-cache"
import type { UserLocalTable } from "~/types/types-table"
import cui from "~/components/custom-ui"
import { useActiveSyncNum } from "~/hooks/useCommon"
import { RouteAndLiuRouter, useRouteAndLiuRouter } from "~/routes/liu-router"
import { showErrMsg } from "~/pages/level1/tools/show-msg"
import liuApi from "~/utils/liu-api"
import { redirectForWxGzhOpenid } from "../../../utils/pay-tools"

let timeout1: LiuTimeout  // in order to avoid the view from always loading
let timeout2: LiuTimeout  // for setDataState

export function useSubscribeContent() {
  const rr = useRouteAndLiuRouter()
  const hasBackend = liuEnv.hasBackend()
  const now = time.getTime()
  const scData = reactive<ScData>({
    state: hasBackend ? pageStates.LOADING : pageStates.NEED_BACKEND,
    initStamp: now,
  })

  initSubscribeContent(scData)

  const onTapBuyViaStripe = async () => {
    const { subPlanInfo } = scData
    if(!subPlanInfo) {
      console.warn("there is no subPlanInfo")
      return
    }
    const stripeData = subPlanInfo.stripe
    if(!stripeData) {
      console.warn("subPlanInfo.stripe is required")
      return
    }

    toBuyViaStripe(scData)
  }

  const onTapManage = () => {
    const url = scData.stripe_portal_url
    if(!url) {
      console.warn("there is no stripe_portal_url")
      return
    }
    window.open(url, "_blank")
  }

  const onTapRefund = () => {
    toRefund(scData)
  }

  const onTapBuyViaUnion = () => {
    toBuyViaUnion(scData, rr)
  }



  return {
    scData,
    onTapBuyViaStripe,
    onTapBuyViaUnion,
    onTapManage,
    onTapRefund,
  }
}


async function toBuyViaUnion(
  scData: ScData,
  rr: RouteAndLiuRouter,
) {
  // 1. get params
  const { subPlanInfo } = scData
  if (!subPlanInfo) {
    console.warn("there is no subPlanInfo")
    return
  }

  // 2. construct query
  const subscription_id = subPlanInfo.id
  const data2: Param_PaymentOrder_A = {
    operateType: "create_order",
    subscription_id,
  }
  const url2 = APIs.PAYMENT_ORDER

  // 3. request
  cui.showLoading({ title_key: "tip.hold_on" })
  const res3 = await liuReq.request<Res_PO_CreateOrder>(url2, data2)
  cui.hideLoading()

  console.log("res3: ")
  console.log(res3)
  console.log(" ")

  // 4. handle result
  const { code, data } = res3
  if(code !== "0000" || !data) {
    showErrMsg("order", res3)
    return
  }

  // 5. show qrcode if it is PC
  const od = data.orderData
  const order_id = od.order_id
  const cha = liuApi.getCharacteristic()
  if(cha.isPC) {
    cui.showQRCodePopup({ bindType: "union_pay", order_id })
    return
  }

  // 6. login with wx gzh for openid
  // and pull wxpay popup if we are in Weixin App
  if(cha.isWeChat && cha.isMobile) {
    redirectForWxGzhOpenid(order_id)
    return
  }

  // 7. redirect to alipay page if we are in Alipay App
  if(cha.isAlipay && cha.isMobile) {
    return
  }
  
  // 8. otherwise, go to payment-page
  rr.router.push({
    name: "payment",
    params: { order_id },
  })

}


async function toRefund(
  scData: ScData
) {
  const { showRefundBtn } = scData
  if(!showRefundBtn) return

  const res1 = await cui.showModal({
    iconName: "emojis-crying_face_color",
    content_key: "payment.refund_content",
    confirm_key: "payment.to_refund",
    cancel_key: "common.back"
  })
  if(!res1.confirm) return
  
  // cui.showLoading({ title_key: "tip.hold_on" })
  // const url = APIs.REQUEST_REFUND
  // const param = { operateType: "cancel_and_refund" }
  // const res2 = await liuReq.request(url, param)

  
}


async function toBuyViaStripe(
  scData: ScData,
) {
  const id = scData.subPlanInfo?.id
  if(!id) return
  const parma = {
    operateType: "create_stripe",
    subscription_id: id,
  }

  cui.showLoading({ title_key: "tip.hold_on" })
  
  const url = APIs.SUBSCRIBE_PLAN
  const res = await liuReq.request<Res_SubPlan_StripeCheckout>(url, parma)

  cui.hideLoading()

  const rData = res.data
  if(rData?.checkout_url) {
    location.href = rData.checkout_url
  }
  
}


function initSubscribeContent(
  scData: ScData,
) {

  if(scData.state === pageStates.NEED_BACKEND) return

  // 1. listen to activeSyncNum
  const { activeSyncNum } = useActiveSyncNum()
  watch(activeSyncNum, (newV) => {
    if(newV < 1) return
    checkState(scData)
  }, { immediate: true })

  // 2. if no network while init
  const { isOnline } = useNetwork()
  if(!isOnline.value) {
    setDataState(scData, pageStates.NETWORK_ERR)
  }

  // 3. set delay to check if the status is not equal to 0
  timeout1 = setTimeout(() => {
    if(scData.state !== 0) return
    setDataState(scData, pageStates.NETWORK_ERR)
  }, 5 * time.SECONED)
}

async function checkState(
  scData: ScData,
) {
  const user = await CloudEventBus.getUserFromDB()
  if(!user) return

  // 1. check stripe customer portal created is within 24 hrs
  const sub = user.subscription
  const c1 = sub?.stripe?.customer_portal_created ?? 1
  const c2 = sub?.stripe?.customer_portal_url
  const diff = time.getTime() - (c1 * 1000)
  if(sub?.isOn === "Y" && diff < time.DAY && c2) {
    packUserSubscription(scData, sub)
  }

  // 2. get subscription plan
  getSubscriptionPlan(scData)

}

async function getMembershipRemotely(
  scData: ScData,
) {
  const url = APIs.USER_MEMBERSHIP
  const param = { operateType: "membership" }
  let sub: UserSubscription | undefined
  try {
    const res = await liuReq.request<Res_UserSettings_Membership>(url, param)
    console.log("getMembershipRemotely res: ")
    console.log(res)
    console.log(" ")
    
    if(res.code === "0000" && res.data) {
      sub = res.data.subscription
    }
  }
  catch(err) {
    console.log("getLatestMembership err: ")
    console.log(err)
    console.log(" ")
    setDataState(scData, pageStates.NETWORK_ERR)
    return
  }

  if(!sub || sub.isOn === "N") {
    setDataState(scData, pageStates.OK)
    return
  }

  packUserSubscription(scData, sub, { writeIntoDB: true })
}

// get subscription plan
async function getSubscriptionPlan(
  scData: ScData,
) {
  const url = APIs.SUBSCRIBE_PLAN
  const param = { operateType: "info" }
  try {
    const res = await liuReq.request<Res_SubPlan_Info>(url, param)
    console.log("getSubscriptionPlan res:")
    console.log(res)
    console.log(" ")

    if(res.code === "0000" && res.data) {
      scData.subPlanInfo = res.data
      parsePrice(scData, res.data)
    }
    else {
      setDataState(scData, pageStates.NO_DATA)
      return
    }
  }
  catch(err) {
    console.log("getSubscriptionPlan err: ")
    console.log(err)
    console.log(" ")
    setDataState(scData, pageStates.NETWORK_ERR)
    return
  }

  getMembershipRemotely(scData)
}


function parsePrice(
  scData: ScData,
  res: Res_SubPlan_Info,
) {
  const p = res.price
  if(!p) {
    scData.price_1 = undefined
    scData.price_2 = undefined
    return
  }
  const list = p.split(".")
  scData.price_1 = list[0]
  scData.price_2 = list[1]
}

interface CheckSubOpt {
  writeIntoDB?: boolean   // @default: false
}

function packUserSubscription(
  scData: ScData,
  sub: UserSubscription,
  opt?: CheckSubOpt,
) {
  scData.stripe_portal_url = sub.stripe?.customer_portal_url
  scData.isLifelong = sub.isLifelong
  scData.autoRecharge = sub.autoRecharge
  if(sub.expireStamp) {
    scData.expireStr = liuUtil.showBasicDate(sub.expireStamp)
  }
  else {
    scData.expireStr = undefined
  }

  // check if should show refund btn
  const now = time.getTime()
  const diff = now - (sub.firstChargedStamp ?? 1)
  if(diff < time.WEEK && sub.chargeTimes === 1) {
    scData.showRefundBtn = true
  }
  else {
    scData.showRefundBtn = false
  }
  
  setDataState(scData, pageStates.OK)

  // to write into db
  if(!opt?.writeIntoDB) return
  const { local_id } = localCache.getPreference()
  if(!local_id) return
  const u: Partial<UserLocalTable> = {
    subscription: sub,
    updatedStamp: now,
  }
  db.users.update(local_id, u)
}


function setDataState(
  scData: ScData,
  state: PageState,
) {
  if(timeout1) {
    clearTimeout(timeout1)
    timeout1 = undefined
  }
  if(timeout2) {
    clearTimeout(timeout2)
    timeout2 = undefined
  }

  const now = time.getTime()
  const diff = now - scData.initStamp
  if(diff > 250) {
    scData.state = state
    return
  }
  const ms = 300 - diff
  timeout2 = setTimeout(() => {
    scData.state = state
    timeout2 = undefined
  }, ms)
}
