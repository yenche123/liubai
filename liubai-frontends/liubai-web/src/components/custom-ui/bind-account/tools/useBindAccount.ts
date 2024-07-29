import { reactive } from "vue";
import type { 
  BindAccountParam, 
  BindAccountData, 
  BaResolver,
} from "./types"
import { LiuTimeout } from "~/utils/basic/type-tool";
import cfg from "~/config";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { OpenConnectOperate } from "~/requests/req-types";
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { 
  Res_OC_BindWeCom,
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
})

export function initBindAccount() {
  return {
    TRANSITION_DURATION,
    baData,
    onTapMask,
  }
}


export function showBindAccount(param: BindAccountParam) {
  baData.bindType = param.bindType
  baData.qr_code = ""
  baData.pic_url = ""
  baData.runTimes = 0

  _open()
  fetchData()

  const _wait = (a: BaResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
}

let pollTimeout: LiuTimeout
async function fetchData() {

  // 1. get bindType & operateType
  const bT = baData.bindType
  if(!bT) return
  let operateType: OpenConnectOperate | undefined
  if(bT === "ww_qynb") {
    operateType = "bind-wecom"
  }
  if(!operateType) return

  // 2. get memberId & clear pollTimeout
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(pollTimeout) clearTimeout(pollTimeout)

  // 3. construct request
  const w3 = {
    operateType,
    memberId,
  }
  const url = APIs.OPEN_CONNECT

  console.time("bind account")
  const res3 = await liuReq.request<Res_OC_BindWeCom>(url, w3)
  console.timeEnd("bind account")
  console.log(res3)
  console.log(" ")
  
  const d4 = res3.data
  if(!d4) {
    _over()
    return
  }

  baData.pic_url = d4.qr_code
  const cred = d4.credential
  if(!cred) return
  if(pollTimeout) clearTimeout(pollTimeout)
  pollTimeout = setTimeout(() => {
    checkData(cred)
  }, SEC_6)
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

  // 2. get param
  const bT = baData.bindType
  if(!bT) return
  let operateType: OpenConnectOperate | undefined
  if(bT === "ww_qynb") {
    operateType = "check-wecom"
  }
  if(!operateType) return

  // 3. construct request
  const url = APIs.OPEN_CONNECT
  const b3 = {
    operateType,
    credential,
  }
  const res3 = await liuReq.request<Res_OC_CheckWeCom>(url, b3)
  console.log("checkData res3: ")
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