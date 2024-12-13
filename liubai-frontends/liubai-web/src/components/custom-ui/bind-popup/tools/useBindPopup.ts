import { reactive, toRef, watch } from "vue"
import type { 
  BpData, 
  BpResolver,
} from "./types"
import type { 
  LiuTimeout,
} from "~/utils/basic/type-tool"
import cfg from "~/config"
import liuUtil from "~/utils/liu-util"


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
    checkCanSubmit()
    if(!bpData.firstErr) return
    const phoneCorrect = liuUtil.check.isAllNumber(newV, 11)
    if(!phoneCorrect) return
    delete bpData.firstErr
  })
  watch(secondInputVal, (newV) => {
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
  }
}


function checkCanSubmit() {
  const { firstInputVal, secondInputVal } = bpData
  if(bpData.bindType === "phone") {
    const res1 = liuUtil.check.isAllNumber(firstInputVal, 11)
    const res2 = liuUtil.check.isAllNumber(secondInputVal, 6)
    bpData.canSubmit = Boolean(res1 && res2)
  }
  
}

export function showBindPopup(param: BpData) {
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

