
import { reactive, ref } from "vue"
import valTool from "~/utils/basic/val-tool"
import { SnackbarParam } from "~/types/other/types-snackbar"
import { SbResolver } from "./tools/types"
import type { LiuTimeout } from "~/utils/basic/type-tool"


let _resolve: SbResolver | undefined
let autoTimeout: LiuTimeout
const TRANSITION_DURATION = 150
const enable = ref(false)
const show = ref(false)

const sbData = reactive({
  text: "",
  text_key: "",
  action: "",
  action_key: "",
  action_color: "",
  duration: 0,
  dot_color: "",
})

export function initSnackBar() {
  return {
    TRANSITION_DURATION,
    enable,
    show,
    sbData,
    onTapAction,
  }
}

export async function showSnackBar(opt: SnackbarParam) {
  if(!opt.text && !opt.text_key) {
    console.error("showSnackBar 必须含有参数 text 或 text_key")
  }

  sbData.text = opt.text ?? ""
  sbData.text_key = opt.text_key ?? ""
  sbData.action = opt.action ?? ""
  sbData.action_key = opt.action_key ?? ""
  sbData.action_color = opt.action_color ?? ""
  sbData.duration = opt.duration ?? 0
  sbData.dot_color = opt.dot_color ?? ""

  await _open()

  const _wait = (a: SbResolver): void => {
    _resolve = a
  }

  listenAutoClose()

  return new Promise(_wait)
}

function listenAutoClose() {
  if(autoTimeout) clearTimeout(autoTimeout)
  let hasAction = Boolean(sbData.action_key) || Boolean(sbData.action)

  let duration = hasAction ? 3500 : 2500
  if(sbData.duration) duration = sbData.duration

  autoTimeout = setTimeout(() => {
    _resolve && _resolve({ result: "auto" })
    _close()
  }, duration)
}


function onTapAction() {
  if(autoTimeout) clearTimeout(autoTimeout)
  _resolve && _resolve({ result: "tap" })
  _close()
}

async function _open() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function _close() {
  if(!enable.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  if(!show.value) enable.value = false
}

