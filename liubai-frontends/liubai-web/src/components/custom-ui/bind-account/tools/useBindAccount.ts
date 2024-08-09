import { reactive } from "vue";
import type { 
  BindAccountParam, 
  BindAccountData, 
  BaResolver,
} from "./types"
import { LiuTimeout } from "~/utils/basic/type-tool";
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

const SEC_4 = time.SECONED * 4
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

  // 1. get memberId & clear pollTimeout
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return
  if(pollTimeout) clearTimeout(pollTimeout)

  // 2. to request 
  const bT = baData.bindType
  if(bT === "ww_qynb") {
    fetchWeCom(memberId)
  }
  else if(bT === "wx_gzh") {
    fetchWeChat(memberId)
  }
  
}

async function fetchWeChat(
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


async function fetchWeCom(
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

async function checkWeCom(
  credential: string,
) {
  const url = APIs.OPEN_CONNECT
  const b3 = {
    operateType: "check-wecom",
    credential,
  }
  const res3 = await liuReq.request<Res_OC_CheckWeCom>(url, b3)
  console.log("checkWeCom res3: ")
  console.log(res3)
  console.log(" ")
  
  // 4. check result
  const d4 = res3.data
  const status = d4?.status
  if(status !== "waiting") {
    _over()
    return
  }
  
  pollTimeout = setTimeout(() => {
    checkData(credential)
  }, SEC_4)
}

async function checkWeChat(
  credential: string,
) {
  const url = APIs.OPEN_CONNECT
  const b3 = {
    operateType: "check-wechat",
    credential,
  }
  const res3 = await liuReq.request<Res_OC_CheckWeChat>(url, b3)
  console.log("checkWeChat res3: ")
  console.log(res3)
  console.log(" ")
  
  // 4. check result
  const d4 = res3.data
  const status = d4?.status
  if(status !== "waiting") {
    _over()
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
    _over()
    return
  }

  // 2. to check out specific data
  const bT = baData.bindType
  if(bT === "ww_qynb") {
    checkWeCom(credential)
  }
  else if(bT === "wx_gzh") {
    checkWeChat(credential)
  }
  
}


function onTapMask() {
  if(pollTimeout) clearTimeout(pollTimeout)
  _over()
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

function _over() {
  _resolve && _resolve(true)
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