import thirdLink from "~/config/third-link";
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { 
  Res_UserLoginInit,
  Res_UL_WxGzhBase,
  Res_PO_WxpayJsapi,
} from "~/requests/req-types";
import { 
  type Wxpay_Jsapi_Params,
} from "~/types/types-cloud";
import time from "~/utils/basic/time";
import { BoolFunc } from "~/utils/basic/type-tool";
import localCache from "~/utils/system/local-cache";
import { waitWxJSBridge } from "~/utils/wait/wait-window-loaded";
import cui from "~/components/custom-ui";
import { showErrMsg } from "~/pages/level1/tools/show-msg";

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
    order_id,
    wx_gzh_openid,
  }
  cui.showLoading({ title_key: "payment.ready_to_pay" })
  const res3 = await liuReq.request<Res_PO_WxpayJsapi>(url3, w3)
  console.log("buyViaWxpayJSAPI res3:")
  console.log(res3)
  cui.hideLoading()

  // 4. get param of Res_PO_WxpayJsapi
  const code4 = res3.code
  const data4 = res3.data
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
    showErrMsg("order", res3)
    return false
  }
  
  // 5. pull wxpay
  vwjData.param = data4.param
  vwjData.expireStamp = time.getTime() + time.MINUTE
  const res5 = await _pullWxpay(data4.param)
  return res5
}

// pay by alipay.trade.wap.pay
export async function buyViaAlipayWap(
  order_id: string,
) {
  
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