import { reactive, ShallowRef, toRef, useTemplateRef, watch } from "vue"
import type { 
  BpData, 
  BpParam, 
  BpResolver,
  BpType,
} from "./types"
import type { 
  LiuTimeout,
} from "~/utils/basic/type-tool"
import cfg from "~/config"
import liuUtil from "~/utils/liu-util"
import { useThrottleFn } from "~/hooks/useVueUse"
import { i18n } from "~/locales"
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"


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

let emailInputRef: ShallowRef<HTMLInputElement | null>
let phoneInputRef: ShallowRef<HTMLInputElement | null>
let secondInputRef: ShallowRef<HTMLInputElement | null>

export function initBindPopup() {

  emailInputRef = useTemplateRef<HTMLInputElement>("emailInputRef")
  phoneInputRef = useTemplateRef<HTMLInputElement>("phoneInputRef")
  secondInputRef = useTemplateRef<HTMLInputElement>("secondInputRef")

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
    emailInputRef,
    phoneInputRef,
    secondInputRef,
    bpData,
    TRANSITION_DURATION,
    onTapSubmit,
    onTapClose,
    onEnterFromFirstInput: useThrottleFn(toEnterFromFirstInput, 1000),
    onEnterFromSecondInput: useThrottleFn(toEnterFromSecondInput, 1000),
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
  const canSubmit = Boolean(res1 && res2)
  bpData.canSubmit = canSubmit

  if(canSubmit && bpData.btnErr) {
    delete bpData.btnErr
  }

}


function getFirstInputResult() {
  const { firstInputVal } = bpData
  let firstInputCorrect = false

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

  return { firstInputCorrect, errMsg }
}

function onTapGettingCode() {
  if(bpData.btnLoading || bpData.sendCodeStatus !== "can_tap") return
  const { firstInputCorrect, errMsg } = getFirstInputResult()

  // 2. check if first input is correct
  if(!firstInputCorrect) {
    bpData.firstErr = errMsg
    return
  }

  // 3. get required data to request code
  const bT = bpData.bindType
  if(bT === "phone") {
    toGetCodeForPhone(bpData)
  }
  else if(bT === "email") {
    // WIP: request auth code for binding email
  }
  
}


async function toGetCodeForPhone(
  bpData: BpData,
) {
  const phone = `86_${bpData.firstInputVal}`
  const url = APIs.BIND_DATA
  const body = {
    operateType: "request-sms",
    plz_enc_phone: phone,
  }
  bpData.sendCodeStatus = "loading"

  console.warn("ready to send!")
  console.log(body)

  
  const res = await liuReq.request(url, body)
  console.log("toGetCodeForPhone res: ")
  console.log(res)

  const { code } = res
  if(code === "0000") {
    bpData.sendCodeStatus = "counting"
    return
  }

  const t = i18n.global.t
  bpData.sendCodeStatus = "can_tap"
  if(code === "US003") {
    bpData.firstErr = t("bind.err_3")
  }
  else if(code === "US004") {
    bpData.firstErr = t("bind.err_5")
  }
  else {
    bpData.btnErr = t("err.unknown_err")
  }
}

function toEnterFromSecondInput() {
  if(bpData.btnLoading || bpData.sendCodeStatus !== "can_tap") return
  if(!bpData.canSubmit) return
  onTapSubmit()
  secondInputRef?.value?.blur()
}

function toEnterFromFirstInput() {
  if(bpData.btnLoading || bpData.sendCodeStatus !== "can_tap") return
  const { firstInputCorrect, errMsg } = getFirstInputResult()
  if(!firstInputCorrect) return
  onTapGettingCode()

  const bT = bpData.bindType
  if(bT === "email") {
    emailInputRef?.value?.blur()
  }
  else if(bT === "phone") {
    phoneInputRef?.value?.blur()
  }
  secondInputRef?.value?.focus()
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

