import { reactive } from "vue";
import type { 
  BindAccountParam, 
  BindAccountData, 
  BaResolver,
  BaResult,
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

const SEC_4 = time.SECONED * 4
const SEC_5 = time.SECONED * 5
const SEC_6 = time.SECONED * 6

const TRANSITION_DURATION = 350
let _resolve: BaResolver | undefined
const baData = reactive<BindAccountData>({
  show: false,
  enable: false,
  qr_code: "",
  pic_url: "",
  runTimes: 0,
  loading: true,
})

export function initBindAccount() {
  return {
    TRANSITION_DURATION,
    baData,
    onTapMask,
    onImgLoaded,
  }
}


export function showBindAccount(param: BindAccountParam) {
  baData.bindType = param.bindType
  baData.qr_code = ""
  baData.pic_url = ""
  baData.runTimes = 0
  baData.loading = true
  baData.state = param.state

  _open()
  fetchData()

  const _wait = (a: BaResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
}


function onImgLoaded() {
  console.log("onImgLoaded......")
  baData.loading = false
}

let pollTimeout: LiuTimeout
async function fetchData() {

  // 1. clear pollTimeout
  const bT = baData.bindType
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
  const state = baData.state
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
  baData.qr_code = d.qr_code
  baData.loading = false

  const cred = d.credential
  if(!cred) return
  if(pollTimeout) clearTimeout(pollTimeout)
  pollTimeout = setTimeout(() => {
    checkData(cred)
  }, SEC_5)
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

  baData.qr_code = d4.qr_code
  baData.loading = false
  
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

  baData.pic_url = d4.pic_url
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
  }, SEC_4)
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
  if(!baData.enable) return
  baData.runTimes++
  if(baData.runTimes > 100) {
    _over({ resultType: "plz_check" })
    return
  }

  // 2. to check out specific data
  const bT = baData.bindType
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
  if(baData.show) return
  if(toggleTimeout) clearTimeout(toggleTimeout)
  baData.enable = true
  toggleTimeout = setTimeout(() => {
    baData.show = true
  }, cfg.frame_duration)
}

function _over(
  res?: BaResult,
) {
  if(!res) {
    res = { resultType: "error" }
  }
  _resolve && _resolve(res)
  _close()
}

function _close() {
  if(!baData.enable) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  baData.show = false
  toggleTimeout = setTimeout(() => {
    baData.enable = false
  }, TRANSITION_DURATION)
}