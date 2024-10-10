import thirdLink from "~/config/third-link";
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { 
  Res_UserLoginInit,
  Res_UL_WxGzhBase,
  Res_PO_WxpayJsapi,
  Res_PO_AlipayWap,
} from "~/requests/req-types";
import { 
  type UserSubscription,
  type Wxpay_Jsapi_Params,
} from "~/types/types-cloud";
import time from "~/utils/basic/time";
import type { BoolFunc, SimpleObject } from "~/utils/basic/type-tool";
import localCache from "~/utils/system/local-cache";
import { waitWxJSBridge } from "~/utils/wait/wait-window-loaded";
import cui from "~/components/custom-ui";
import { showErrMsg } from "~/pages/level1/tools/show-msg";
import { type LiuRqReturn } from "~/requests/tools/types";
import liuUtil from "~/utils/liu-util";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import usefulTool from "~/utils/basic/useful-tool";
import { type UserLocalTable } from "~/types/types-table";
import { db } from "~/utils/db";

let initData: Res_UserLoginInit | undefined

export async function getLoginInitData() {
  const url = APIs.LOGIN
  const res = await liuReq.request<Res_UserLoginInit>(url, { operateType: "init" })
  if(res.code === "0000" && res.data) {
    initData = res.data
  }
}

export async function redirectForWxGzhOpenid(
  order_id: string,
) {
  // 1. get initData
  if(!initData) {
    await getLoginInitData()
    if(!initData) {
      console.warn("fail to get initData...")
      return
    }
  }

  // 2. get state & wxGzhAppid
  const { state, wxGzhAppid } = initData
  if(!state || !wxGzhAppid) {
    console.warn("state and wxGzhAppid are required")
    return
  }
  localCache.setOnceData("wxGzhOAuthState", state)

  // 3. construct redirect_uri
  const redirect_uri = location.origin + `/payment/${order_id}`
  const url = new URL(thirdLink.WX_GZH_OAUTH)
  const sp = url.searchParams
  sp.append("appid", wxGzhAppid)
  sp.append("redirect_uri", redirect_uri)
  sp.append("response_type", "code")
  sp.append("scope", "snsapi_base")
  sp.append("state", state)
  const link = url.toString() + `#wechat_redirect`
  location.href = link
}

export async function getWxGzhOpenid(
  oauth_code: string,
  state: string,
) {
  const url = APIs.LOGIN
  const opt = {
    operateType: "wx_gzh_base",
    oauth_code,
    state,
  }
  const res = await liuReq.request<Res_UL_WxGzhBase>(url, opt)
  console.log("getWxGzhOpenid res:")
  console.log(res)

  if(res.code === "0000" && res.data) {
    return res.data.wx_gzh_openid
  }
}

interface VwjData {
  order_id?: string
  wx_gzh_openid?: string
  param?: Wxpay_Jsapi_Params
  expireStamp?: number
}

const vwjData: VwjData = {}

// pay by JSAPI of Wxpay
export async function buyViaWxpayJSAPI(
  order_id: string,
  wx_gzh_openid: string
) {
  // 0.1 define a function to pull wxpay
  const _pullWxpay = async (param: Wxpay_Jsapi_Params) => {
    await waitWxJSBridge()
    const _wait = (a: BoolFunc) => {
      WeixinJSBridge.invoke("getBrandWCPayRequest", param, (res: any) => {
        console.log("WeixinJSBridge.invoke res:")
        console.log(res)
        if(res?.err_msg === "get_brand_wcpay_request:ok") {
          a(true)
        }
        else {
          a(false)
        }
      })
    }
    return new Promise(_wait)
  }

  // 1. invoke directly
  const now1 = time.getTime()
  const e1 = vwjData.expireStamp ?? 1
  const diff1 = e1 - now1
  if(order_id === vwjData.order_id && wx_gzh_openid === vwjData.wx_gzh_openid) {
    if(vwjData.param && diff1 > 0) {
      const res1 = await _pullWxpay(vwjData.param)
      return res1
    }
  }

  // 2. set new data
  vwjData.param = undefined
  if(order_id !== vwjData.order_id) {
    vwjData.order_id = order_id
  }
  if(wx_gzh_openid !== vwjData.wx_gzh_openid) {
    vwjData.wx_gzh_openid = wx_gzh_openid
  }

  // 3. fetch for param
  const url3 = APIs.PAYMENT_ORDER
  const w3 = {
    operateType: "wxpay_jsapi",
    order_id,
    wx_gzh_openid,
  }
  cui.showLoading({ title_key: "payment.ready_to_pay" })
  const res3 = await liuReq.request<Res_PO_WxpayJsapi>(url3, w3)
  console.log("buyViaWxpayJSAPI res3:")
  console.log(res3)
  cui.hideLoading()

  // 4. get param of Res_PO_WxpayJsapi
  const res4 = _handlePayResult(res3)
  if(!res4) return false
  const data4 = res3.data as Res_PO_WxpayJsapi
  
  // 5. pull wxpay
  vwjData.param = data4.param
  vwjData.expireStamp = time.getTime() + time.MINUTE
  const res5 = await _pullWxpay(data4.param)
  return res5
}

interface VawData {
  order_id?: string
  wap_url?: string
  expireStamp?: number
}

const vawData: VawData = {}

// pay by alipay.trade.wap.pay
export async function buyViaAlipayWap(
  order_id: string,
) {
  // 1. check out vawData
  if(order_id === vawData.order_id && vawData.wap_url) {
    const now1 = time.getLocalTime()
    const e1 = vawData.expireStamp ?? 1
    const diff1 = e1 - now1
    if(diff1 > 0) {
      jumpToAlipayWap()
      return true
    }
  }

  // 2. set new data
  vawData.wap_url = undefined
  if(order_id !== vawData.order_id) {
    vawData.order_id = order_id
  }

  // 3. fetch for wap_url
  cui.showLoading({ title_key: "payment.ready_to_pay" })
  const res3 = await preloadAlipayWap(order_id)
  cui.hideLoading()

  console.log("buyViaAlipayWap res3: ")
  console.log(res3)

  // 4. get wap_url of Res_PO_AlipayWap
  const res4 = _handlePayResult(res3)
  if(!res4) return false

  // 5. redirect to wap_url
  jumpToAlipayWap()
  return true
}

function jumpToAlipayWap() {
  const url = vawData.wap_url
  if(!url) return
  cui.showLoading({ title_key: "payment.paying" })
  location.href = url
  setTimeout(() => {
    cui.hideLoading()
  }, 1500)
}

export async function preloadAlipayWap(
  order_id: string,
) {
  const url3 = APIs.PAYMENT_ORDER
  const w3 = {
    operateType: "alipay_wap",
    order_id,
  }
  console.log("preloadAlipayWap.........")
  const res3 = await liuReq.request<Res_PO_AlipayWap>(url3, w3)
  console.log("preloadAlipayWap res3:")
  console.log(res3)
  const wap_url = res3.data?.wap_url
  if(!wap_url) return res3

  vawData.order_id = order_id
  vawData.wap_url = wap_url
  vawData.expireStamp = time.getLocalTime() + time.MINUTE

  return res3
}

function _handlePayResult(
  res: LiuRqReturn<any>,
) {
  const code4 = res.code
  const data4 = res.data
  if(code4 === "E4004") {
    showNoOrder()
    return false
  }
  if(code4 === "E4006") {
    showOrderExpired()
    return false
  }
  if(code4 === "P0003") {
    showOrderBeingPaid()
    return false
  }
  if(code4 !== "0000" || !data4) {
    showErrMsg("order", res)
    return false
  }

  return true
}


function showOrderBeingPaid() {
  cui.showModal({
    title: "⌛",
    content_key: "payment.order_being_paid",
    showCancel: false,
    isTitleEqualToEmoji: true,
  })
}

function showOrderExpired() {
  cui.showModal({
    title: "😬",
    content_key: "payment.order_expired",
    showCancel: false,
    isTitleEqualToEmoji: true,
  })
}

function showNoOrder() {
  cui.showModal({
    title: "🫠",
    content_key: "payment.order_not_found",
    showCancel: false,
    isTitleEqualToEmoji: true,
  })
}

export async function storageMySubscription(
  latestSub?: UserSubscription,
) {
  const wStore = useWorkspaceStore()
  const userId = wStore.userId
  if(!userId) return
  const oldSub = liuUtil.toRawData(wStore.userSubscription)
  const newSub = latestSub as unknown as SimpleObject
  const isSame = usefulTool.isSameSimpleObject(oldSub ?? undefined, newSub)
  if(isSame) return
  const u: Partial<UserLocalTable> = {
    subscription: latestSub,
    updatedStamp: time.getTime(),
  }
  const res = await db.users.update(userId, u)
  console.log("storageMySubscription res: ", res)
  wStore.setSubscriptionAfterUpdatingDB(latestSub)
}