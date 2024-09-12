import { inject, reactive, watch } from "vue";
import { type RouteAndLiuRouter, useRouteAndLiuRouter } from "~/routes/liu-router";
import liuEnv from "~/utils/liu-env";
import { type PcData } from "./types";
import { pageStates } from "~/utils/atom"
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import { useNetworkStore } from "~/hooks/stores/useNetworkStore";
import type { 
  Res_OrderData, 
  Res_UL_WxGzhBase, 
  Res_PO_GetOrder,
} from "~/requests/req-types";
import liuApi from "~/utils/liu-api";
import typeCheck from "~/utils/basic/type-check";
import localCache from "~/utils/system/local-cache";
import { deviceChaKey } from "~/utils/provide-keys";
import valTool from "~/utils/basic/val-tool";

export function usePaymentContent() {
  const rr = useRouteAndLiuRouter()
  const hasBackend = liuEnv.hasBackend()
  const pcData = reactive<PcData>({
    state: hasBackend ? pageStates.LOADING : pageStates.NEED_BACKEND,
  })

  const cha = inject(deviceChaKey)
  initPaymentContent(pcData, rr)

  return {
    pcData,
    cha,
  }
}


function initPaymentContent(
  pcData: PcData,
  rr: RouteAndLiuRouter,
) {
  if(pcData.state === pageStates.NEED_BACKEND) return
  watch(rr.route, (newV) => {

    // 1. get & set order_id
    const { order_id } = newV.params
    if(!valTool.isStringWithVal(order_id)) return
    if(pcData.order_id === order_id) return
    pcData.order_id = order_id

    // 2. check out code from wx gzh oAuth
    const { code } = newV.query
    const cha = liuApi.getCharacteristic()
    if(valTool.isStringWithVal(code)) {
      if(cha.isWeChat) {
        loginWithWxGzhOAuthCode(pcData, rr)
        return
      }
    }

    fetchOrderData(pcData)
    
  }, { immediate: true })
}

async function loginWithWxGzhOAuthCode(
  pcData: PcData,
  rr: RouteAndLiuRouter,
) {

  // 1. get query
  const qry = rr.route.query
  const { code, state } = qry
  if(!code || !state) {
    console.warn("WeChat 授权失败.......")
    return
  }
  if(!code || !typeCheck.isString(code)) return
  if(!state || !typeCheck.isString(state)) return

  // 2. check out state
  const onceData = localCache.getOnceData()
  const oldState = onceData.wxGzhOAuthState
  if(oldState !== state) {
    console.warn("state & oldState not match!")
    console.log("oldState: ", oldState)
    console.log(" ")
    return
  }

  // 3. clear query
  const param3 = rr.route.params
  const name3 = rr.route.name
  rr.router.replace({ name: name3, params: param3 })

  // 4. get wx_gzh_openid
  const url4 = APIs.LOGIN
  const w4 = {
    operateType: "wx_gzh_base",
    state,
    oauth_code: code,
  }
  const res4 = await liuReq.request<Res_UL_WxGzhBase>(url4, w4)
  if(res4.code === "0000" && res4.data) {
    pcData.wx_gzh_openid = res4.data.wx_gzh_openid
    fetchOrderData(pcData, { fr: "wx_gzh_oauth" })
    return
  }

  console.warn("get wx_gzh_openid failed!")
  console.log(res4)
}


interface FetchOrderDataOpt {
  fr?: "wx_gzh_oauth"
}

async function fetchOrderData(
  pcData: PcData,
  opt?: FetchOrderDataOpt,
) {
  // 1. get params
  const { order_id } = pcData
  if(!order_id) return

  // 2. checking out network
  const nStore = useNetworkStore()
  if(nStore.level < 1) {
    pcData.state = pageStates.NETWORK_ERR
    return
  }

  // 3. fetch
  const url = APIs.PAYMENT_ORDER
  const w3 = {
    operateType: "get_order",
    order_id,
  }
  const res3 = await liuReq.request<Res_PO_GetOrder>(url, w3)
  
  // 4. handle data
  const { code: code4, data: data4 } = res3
  if(code4 === "E4003") {
    pcData.state = pageStates.NO_AUTH
  }
  else if(code4 === "E4004") {
    pcData.state = pageStates.NO_DATA
  }
  else if(code4 === "0000") {
    pcData.state = pageStates.OK
  }
  else {
    pcData.state = pageStates.NETWORK_ERR
  }
  if(!data4) {
    resetOrderData(pcData)
    return
  }
  
  setNewOrderData(pcData, data4.orderData)
}

function setNewOrderData(
  pcData: PcData,
  od: Res_OrderData,
) {
  pcData.od = od
  if(od.orderAmount) {
    pcData.order_amount_txt = od.orderAmount.toFixed(2)
  }
}

function resetOrderData(
  pcData: PcData,
) {
  // pcData.od = undefined
  pcData.order_amount_txt = undefined

}
