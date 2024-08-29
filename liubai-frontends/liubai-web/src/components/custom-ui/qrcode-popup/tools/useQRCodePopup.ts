import { reactive } from "vue";
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

const SEC_3 = time.SECONED * 3
const SEC_4 = time.SECONED * 4
const SEC_6 = time.SECONED * 6

const TRANSITION_DURATION = 350
let _resolve: QpResolver | undefined
const qpData = reactive<QpData>({
  show: false,
  enable: false,
  qr_code: "",
  pic_url: "",
  runTimes: 0,
  loading: true,
})

export function initQRCodePopup() {
  return {
    TRANSITION_DURATION,
    qpData,
    onTapMask,
    onImgLoaded,
  }
}


export function showQRCodePopup(param: QpParam) {
  qpData.bindType = param.bindType
  qpData.qr_code = ""
  qpData.pic_url = ""
  qpData.runTimes = 0
  qpData.loading = true
  qpData.state = param.state

  _open()
  fetchData()

  const _wait = (a: QpResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
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
  if(bT === "wx_gzh_scan") {
    fetch_wx_gzh_scan()
    return
  }

  // 2. get memberId
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return
  
  // 3. to request 
  if(bT === "ww_qynb") {
    fetch_bind_wecom(memberId)
  }
  else if(bT === "wx_gzh") {
    fetch_bind_wechat(memberId)
  }
  
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
  console.log("fetch_check_wecom res3: ")
  console.log(res3)
  console.log(" ")
  
  // 4. check result
  const d4 = res3.data
  const status = d4?.status
  if(status !== "waiting") {
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
  const res = await fetchScanCheck(credential)
  const { code, data } = res
  if(code !== "0000" || !data) {
    _over()
    return
  }
  const { status, credential_2 } = data
  if(status === "plz_check") {
    _over({ resultType: "plz_check", credential, credential_2 })
    return
  }
  if(status !== "waiting") {
    _over()
    return
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
  console.log("fetch_check_wechat res3: ")
  console.log(res3)
  console.log(" ")
  
  // 4. check result
  const d4 = res3.data
  const status = d4?.status
  if(status !== "waiting") {
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


function onTapMask() {
  if(pollTimeout) clearTimeout(pollTimeout)
  _over({ resultType: "cancel" })
}

let toggleTimeout: LiuTimeout
function _open() {
  if(qpData.show) return
  if(toggleTimeout) clearTimeout(toggleTimeout)
  qpData.enable = true
  toggleTimeout = setTimeout(() => {
    qpData.show = true
  }, cfg.frame_duration)
}

function _over(
  res?: QpResult,
) {
  if(!res) {
    res = { resultType: "error" }
  }
  _resolve && _resolve(res)
  _close()
}

function _close() {
  if(!qpData.enable) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  qpData.show = false
  toggleTimeout = setTimeout(() => {
    qpData.enable = false
  }, TRANSITION_DURATION)
}