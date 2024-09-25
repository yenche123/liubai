import { reactive, watch } from "vue";
import type { 
  QpParam, 
  QpData, 
  QpResolver,
  QpResult,
} from "./types"
import type { LiuTimeout } from "~/utils/basic/type-tool";
import cfg from "~/config";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { 
  Res_OC_BindWeChat,
  Res_OC_BindWeCom,
  Res_OC_CheckWeChat,
  Res_OC_CheckWeCom,
} from "~/requests/req-types";
import time from "~/utils/basic/time";
import { 
  fetchScanCheck, 
  fetchWxGzhScan,
} from "~/pages/level1/tools/requests";
import { useRouteAndLiuRouter, type RouteAndLiuRouter } from "~/routes/liu-router";
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import { fetchOrder } from "~/requests/shared";
import { useThrottleFn } from "~/hooks/useVueUse";

const SEC_3 = time.SECONED * 3
const SEC_4 = time.SECONED * 4
const SEC_6 = time.SECONED * 6

const TRANSITION_DURATION = 350
let _resolve: QpResolver | undefined

const queryKey = "qrcodepopup"
const qpData = reactive<QpData>({
  show: false,
  enable: false,
  qr_code: "",
  pic_url: "",
  runTimes: 0,
  loading: true,
  reloadRotateDeg: 0,
})

let rr: RouteAndLiuRouter | undefined

export function initQRCodePopup() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()

  return {
    TRANSITION_DURATION,
    qpData,
    onTapMask,
    onImgLoaded,
    onTapRefresh: useThrottleFn(onTapRefresh, 1000),
  }
}


export function showQRCodePopup(param: QpParam) {
  const bT = param.bindType
  qpData.bindType = bT
  qpData.order_id = param.order_id
  qpData.qr_code = ""
  qpData.pic_url = ""
  qpData.runTimes = 0
  qpData.loading = true
  qpData.state = param.state
  qpData.fr = param.fr

  const _wait = (a: QpResolver) => {
    _resolve = a
  }

  if(bT === "union_pay" && !param.order_id) {
    console.warn("order_id is required while union_pay")
    return new Promise(_wait)
  }

  openIt(rr, queryKey)
  fetchData()

  return new Promise(_wait)
}


async function onTapRefresh() {
  // 1. check out args
  const bT = qpData.bindType
  const order_id = qpData.order_id
  if(bT !== "union_pay" || !order_id) {
    return
  }

  // 2. fetch order
  qpData.reloadRotateDeg += 360
  const res = await fetchOrder(order_id)
  console.log("fetch order result: ")
  console.log(res)
  console.log(" ")
  
  // 3. handle result
  const { code, data } = res
  if(code === "E4004") {
    _over()
    return
  }
  if(!data) return
  const od = data.orderData
  if(od.canPay === false || od.orderStatus === "PAID") {
    _over({ resultType: "plz_check" })
  }
}


function listenRouteChange() {
  if(!rr) return
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(qpData.bindType) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
      return
    }
    _toClose()
  }, { immediate: true })
}


function onImgLoaded() {
  console.log("onImgLoaded......")
  qpData.loading = false
}

let pollTimeout: LiuTimeout
async function fetchData() {

  // 1. clear pollTimeout
  const bT = qpData.bindType
  if(pollTimeout) clearTimeout(pollTimeout)

  // 2. login via wx gzh scan
  if(bT === "wx_gzh_scan") {
    fetch_wx_gzh_scan()
    return
  }

  // 3. show qrcode for union pay
  if(bT === "union_pay") {
    handle_union_pay()
    return
  }

  // 4. get memberId
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return
  
  // 5. to request 
  if(bT === "ww_qynb") {
    fetch_bind_wecom(memberId)
  }
  else if(bT === "wx_gzh") {
    fetch_bind_wechat(memberId)
  }
  
}


function handle_union_pay() {
  const order_id = qpData.order_id as string
  const origin = location.origin
  const path = `/payment/${order_id}`
  qpData.qr_code = `${origin}${path}`
  qpData.loading = false
}


async function fetch_wx_gzh_scan() {
  const state = qpData.state
  if(!state) {
    console.warn("state is required while wx_gzh_scan")
    return
  }
  const res = await fetchWxGzhScan(state)
  const { code, data: d } = res
  if(code !== "0000" || !d) {
    _over()
    return
  }
  qpData.qr_code = d.qr_code
  qpData.loading = false

  const cred = d.credential
  if(!cred) return
  if(pollTimeout) clearTimeout(pollTimeout)
  pollTimeout = setTimeout(() => {
    checkData(cred)
  }, SEC_4)
}

async function fetch_bind_wechat(
  memberId: string,
) {
  const w3 = {
    operateType: "bind-wechat",
    memberId,
  }
  const url = APIs.OPEN_CONNECT
  const res3 = await liuReq.request<Res_OC_BindWeChat>(url, w3)
  console.log("fetch wechat result: ")
  console.log(res3)
  console.log(" ")
  
  const d4 = res3.data
  if(!d4) {
    _over()
    return
  }

  qpData.qr_code = d4.qr_code
  qpData.loading = false
  
  const cred = d4.credential
  if(!cred) return
  if(pollTimeout) clearTimeout(pollTimeout)
  pollTimeout = setTimeout(() => {
    checkData(cred)
  }, SEC_6)
}


async function fetch_bind_wecom(
  memberId: string,
) {
  const w3 = {
    operateType: "bind-wecom",
    memberId,
  }
  const url = APIs.OPEN_CONNECT
  const res3 = await liuReq.request<Res_OC_BindWeCom>(url, w3)
  console.log("fetch wecom result: ")
  console.log(res3)
  console.log(" ")
  
  const d4 = res3.data
  if(!d4) {
    _over()
    return
  }

  qpData.pic_url = d4.pic_url
  const cred = d4.credential
  if(!cred) return
  if(pollTimeout) clearTimeout(pollTimeout)
  pollTimeout = setTimeout(() => {
    checkData(cred)
  }, SEC_6)
}

async function fetch_check_wecom(
  credential: string,
) {
  const url = APIs.OPEN_CONNECT
  const b3 = {
    operateType: "check-wecom",
    credential,
  }
  const res3 = await liuReq.request<Res_OC_CheckWeCom>(url, b3)
  // console.log("fetch_check_wecom res3: ")
  // console.log(res3)
  // console.log(" ")
  
  // 4. check result
  const res4 = isExpectedCode(res3.code)
  const d4 = res3.data
  const status = d4?.status
  if(res4 && status !== "waiting") {
    _over({ resultType: "plz_check" })
    return
  }
  
  pollTimeout = setTimeout(() => {
    checkData(credential)
  }, SEC_4)
}

// checking scan result for login via wx gzh scan
async function fetch_scan_check(
  credential: string,
) {
  // 1. fetch scan check
  const res = await fetchScanCheck(credential)
  const { code, data } = res
  
  // 2. check if it's an expected code
  const res2 = isExpectedCode(code)
  const status = data?.status
  const credential_2 = data?.credential_2

  // console.log("fetch_scan_check res2: ")
  // console.log(res2)
  // console.log(status)
  // console.log(" ")

  if(res2) {
    if(status === "plz_check" && credential_2) {
      _over({ resultType: "plz_check", credential, credential_2 })
      return
    }
    if(!data || status !== "waiting") {
      _over()
      return
    }
  }

  pollTimeout = setTimeout(() => {
    checkData(credential)
  }, SEC_3)
}


async function fetch_check_wechat(
  credential: string,
) {
  const url = APIs.OPEN_CONNECT
  const b3 = {
    operateType: "check-wechat",
    credential,
  }
  const res3 = await liuReq.request<Res_OC_CheckWeChat>(url, b3)
  // console.log("fetch_check_wechat res3: ")
  // console.log(res3)
  // console.log(" ")
  
  // 4. check result
  const res4 = isExpectedCode(res3.code)
  const d4 = res3.data
  const status = d4?.status
  if(res4 && status !== "waiting") {
    _over({ resultType: "plz_check" })
    return
  }
  
  pollTimeout = setTimeout(() => {
    checkData(credential)
  }, SEC_4)
}


async function checkData(
  credential: string,
) {

  // 1. can we check out data?
  if(!qpData.enable) return
  qpData.runTimes++
  if(qpData.runTimes >= 100) {
    _over({ resultType: "plz_check" })
    return
  }

  // 2. to check out specific data
  const bT = qpData.bindType
  if(bT === "ww_qynb") {
    fetch_check_wecom(credential)
  }
  else if(bT === "wx_gzh") {
    fetch_check_wechat(credential)
  }
  else if(bT === "wx_gzh_scan") {
    fetch_scan_check(credential)
  }
  
}

function isExpectedCode(code: string) {
  const codes = ["0000", "E4004"]
  return codes.includes(code)
}

function onTapMask() {
  if(pollTimeout) clearTimeout(pollTimeout)
  _over({ resultType: "cancel" })
}

function _over(
  res?: QpResult,
) {
  if(!res) {
    res = { resultType: "error" }
  }
  _resolve && _resolve(res)
  closeIt(rr, queryKey)
}

let toggleTimeout: LiuTimeout
function _toOpen() {
  if(qpData.show) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  qpData.enable = true
  toggleTimeout = setTimeout(() => {
    qpData.show = true
  }, cfg.frame_duration)
}

async function _toClose() {
  if(!qpData.enable) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  qpData.show = false
  toggleTimeout = setTimeout(() => {
    qpData.enable = false
  }, TRANSITION_DURATION)
}