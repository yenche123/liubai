import { reactive, toRef, watch } from "vue"
import type { 
  BpData, 
  BpParam, 
  BpResolver,
} from "./types"
import type { 
  LiuTimeout,
} from "~/utils/basic/type-tool"
import cfg from "~/config"
import liuUtil from "~/utils/liu-util"
import { useThrottleFn } from "~/hooks/useVueUse"
import { i18n } from "~/locales"


const TRANSITION_DURATION = 350
let _resolve: BpResolver | undefined

const bpData = reactive<BpData>({
  bindType: "phone",
  compliance: false,
  enable: false,
  show: false,
  sendCodeStatus: "can_tap",
  firstInputVal: "",
  secondInputVal: "",
  canSubmit: false,
  btnLoading: false,
})

export function initBindPopup() {

  const firstInputVal = toRef(bpData, "firstInputVal")
  const secondInputVal = toRef(bpData, "secondInputVal")

  watch(firstInputVal, (newV) => {
    let trimVal = newV.trim()
    if(trimVal !== newV) {
      firstInputVal.value = trimVal
      return
    }
    checkCanSubmit()
    if(!bpData.firstErr) return
    const phoneCorrect = liuUtil.check.isAllNumber(newV, 11)
    if(!phoneCorrect) return
    delete bpData.firstErr
  })
  watch(secondInputVal, (newV) => {
    let trimVal = newV.trim()
    if(trimVal !== newV) {
      secondInputVal.value = trimVal
      return
    }
    checkCanSubmit()
    if(!bpData.secondErr) return
    const smsCorrect = liuUtil.check.isAllNumber(newV, 6)
    if(!smsCorrect) return
    delete bpData.secondErr
  })

  return {
    bpData,
    TRANSITION_DURATION,
    onTapSubmit,
    onTapClose,
    onEnterFromFirstInput: useThrottleFn(toEnterFromFirstInput, 1000),
    onEnterFromSecondInput: useThrottleFn(onTapSubmit, 1000),
    onTapGettingCode,
  }
}


function checkCanSubmit() {
  const { firstInputVal, secondInputVal } = bpData
  let res1 = false
  if(bpData.bindType === "phone") {
    res1 = liuUtil.check.isAllNumber(firstInputVal, 11)
  }
  else {
    res1 = liuUtil.check.isEmail(firstInputVal)
  }

  const res2 = liuUtil.check.isAllNumber(secondInputVal, 6)
  bpData.canSubmit = Boolean(res1 && res2)
}

function onTapGettingCode() {
  if(bpData.btnLoading || bpData.sendCodeStatus !== "can_tap") return
  const { firstInputVal } = bpData
  let firstInputCorrect = false

  // 1. get err msg
  const t = i18n.global.t
  const bT = bpData.bindType
  let errMsg = ""
  if(bT === "phone") {
    firstInputCorrect = liuUtil.check.isAllNumber(firstInputVal, 11)
    errMsg = t("bind.err_1", { num: 11 })
  }
  else {
    firstInputCorrect = liuUtil.check.isEmail(firstInputVal)
    errMsg = t("bind.err_4")
  }

  // 2. check if first input is correct
  if(!firstInputCorrect) {
    bpData.firstErr = errMsg
    return
  }

  // 3. send code
  bpData.sendCodeStatus = "loading"

}


function toEnterFromFirstInput() {

}

export function showBindPopup(param: BpParam) {
  bpData.compliance = param.compliance
  if(bpData.bindType !== param.bindType) {
    bpData.bindType = param.bindType
    bpData.sendCodeStatus = "can_tap"
    bpData.firstInputVal = ""
    bpData.secondInputVal = ""
    delete bpData.firstErr
    delete bpData.secondErr
    delete bpData.btnErr
  }

  const _wait = (a: BpResolver) => {
    _resolve = a
    _toOpen()
  }

  return new Promise(_wait)
}

function onTapSubmit() {
  if(!bpData.canSubmit) return
  delete bpData.btnErr

}

function onTapClose() {
  _resolve && _resolve({ bound: false })
  _toClose()
}

let toggleTimeout: LiuTimeout
function _toOpen() {
  if(bpData.show) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  bpData.enable = true
  toggleTimeout = setTimeout(() => {
    bpData.show = true
  }, cfg.frame_duration)
}

async function _toClose() {
  if(!bpData.enable) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  bpData.show = false
  toggleTimeout = setTimeout(() => {
    bpData.enable = false
  }, TRANSITION_DURATION)
}

