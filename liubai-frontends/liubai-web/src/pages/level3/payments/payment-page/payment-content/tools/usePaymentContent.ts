import { inject, reactive, watch } from "vue";
import { type RouteAndLiuRouter, useRouteAndLiuRouter } from "~/routes/liu-router";
import liuEnv from "~/utils/liu-env";
import { type PcData } from "./types";
import { pageStates } from "~/utils/atom";
import { useNetworkStore } from "~/hooks/stores/useNetworkStore";
import type { Res_OrderData } from "~/requests/req-types";
import liuApi from "~/utils/liu-api";
import typeCheck from "~/utils/basic/type-check";
import localCache from "~/utils/system/local-cache";
import { deviceChaKey } from "~/utils/provide-keys";
import valTool from "~/utils/basic/val-tool";
import { useThrottleFn } from "~/hooks/useVueUse"; 
import cui from "~/components/custom-ui";
import { 
  buyViaAlipayWap,
  buyViaWxpayJSAPI, 
  getWxGzhOpenid, 
  preloadAlipayWap, 
  redirectForWxGzhOpenid,
} from "../../../utils/pay-tools";
import { fetchOrder } from "~/requests/shared";

export function usePaymentContent() {
  const rr = useRouteAndLiuRouter()
  const hasBackend = liuEnv.hasBackend()
  const pcData = reactive<PcData>({
    state: hasBackend ? pageStates.LOADING : pageStates.NEED_BACKEND,
  })

  const cha = inject(deviceChaKey)
  initPaymentContent(pcData, rr)

  const onTapWxpayJSAPI = useThrottleFn(() => {
    whenTapWxpayJSAPI(pcData, rr)
  }, 1000)

  const onTapAlipay = useThrottleFn(() => {
    whenTapAlipay(pcData, rr)
  }, 1000)

  const onTapWxpayH5 = useThrottleFn(() => {
    whenTapWxpayH5(pcData, rr)
  }, 1000)

  return {
    pcData,
    cha,
    onTapAlipay,
    onTapWxpayJSAPI,
    onTapWxpayH5,
  }
}

function whenTapAlipay(
  pcData: PcData,
  rr: RouteAndLiuRouter,
) {
  // 1. check if we can pay
  const od = pcData.od
  if(!od) return
  if(!od.canPay) {
    showCannotPayTip()
    return
  }

  // 2. invoke pay-tool
  const order_id = od.order_id
  buyViaAlipayWap(order_id, rr, "payment")
}

async function whenTapWxpayH5(
  pcData: PcData,
  rr: RouteAndLiuRouter,
) {
  // 1. check if we can pay
  const od = pcData.od
  if(!od) return
  if(!od.canPay) {
    showCannotPayTip()
    return
  }

  // 2. use wxpay H5 but use popup for now
  const order_id = od.order_id
  const res2 = await cui.showQRCodePopup({ bindType: "one_off_pay", order_id })
  if(res2.resultType === "error") return

  // 3. fetch order data
  const res3 = await fetchOrder(order_id)
  const od3 = res3.data?.orderData
  if(od3?.orderStatus === "PAID") {
    rr.router.replace({ name: "payment-success" })
  }
}

async function whenTapWxpayJSAPI(
  pcData: PcData,
  rr: RouteAndLiuRouter,
) {
  // 1. check if we can pay
  const od = pcData.od
  if(!od) return
  if(!od.canPay) {
    showCannotPayTip()
    return
  }

  // 2. redirect to login page if no wx_gzh_openid
  const wx_gzh_openid = pcData.wx_gzh_openid
  const order_id = od.order_id
  if(!wx_gzh_openid) {
    redirectForWxGzhOpenid(order_id)
    return
  }

  // 3. buy via wxpay
  const res3 = await buyViaWxpayJSAPI(order_id, wx_gzh_openid)
  if(res3) {
    rr.router.replace({ name: "payment-success" })
  }
}


function showCannotPayTip() {
  cui.showModal({
    title_key: "payment.cannot_pay",
    content_key: "payment.cannot_pay_tip",
    showCancel: false,
  })
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

    fetchOrderData(pcData, rr)
    
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
  const res4 = await getWxGzhOpenid(code, state)
  if(res4) {
    pcData.wx_gzh_openid = res4
    fetchOrderData(pcData, rr, { fr: "wx_gzh_oauth" })
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
  rr: RouteAndLiuRouter,
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
  const res3 = await fetchOrder(order_id)
  
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


  // 5. pay via wxpay
  const { wx_gzh_openid } = pcData
  if(opt?.fr === "wx_gzh_oauth" && wx_gzh_openid) {
    const res5 = await buyViaWxpayJSAPI(order_id, wx_gzh_openid)
    if(!res5) return
    rr.router.replace({ name: "payment-success" })
    return
  }

  // 6. preload alipay wap if the user is in Alipay App
  const cha = liuApi.getCharacteristic()
  if(cha.isAlipay && cha.isMobile) {
    preloadAlipayWap(order_id)
    return
  }
  
}

function setNewOrderData(
  pcData: PcData,
  od: Res_OrderData,
) {
  pcData.od = od
  if(od.orderAmount) {
    pcData.order_amount_txt = (od.orderAmount / 100).toFixed(2)
  }
}

function resetOrderData(
  pcData: PcData,
) {
  // pcData.od = undefined
  pcData.order_amount_txt = undefined

}
