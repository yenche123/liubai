import { computed, ref } from "vue"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import valTool from "~/utils/basic/val-tool"
import liuUtil from "~/utils/liu-util"

interface DatePickerParam {
  date?: Date
  minDate?: Date
  maxDate?: Date
}

interface DpSuccessRes {
  confirm: boolean
  date?: Date
}

type DpResolver = (res: DpSuccessRes) => void

const TRANSITION_DURATION = 120
const enable = ref(false)
const show = ref(false)
const date = ref<Date | undefined>()
const minDate = ref<Date | undefined>()
const maxDate = ref<Date | undefined>()
const timeStr = computed(() => {
  const d = date.value
  if(!d) return ""
  const hr = valTool.format0(d.getHours())
  const min = valTool.format0(d.getMinutes())
  return hr + ":" + min
})

let _resolve: DpResolver | undefined

export function initDatePicker() {

  return { 
    enable, 
    show, 
    date,
    timeStr, 
    minDate,
    maxDate,
    TRANSITION_DURATION,
    onTapConfirm, 
    onTapCancel,
  }
}

export function showDatePicker(opt?: DatePickerParam): Promise<DpSuccessRes> {
  if(!opt) opt = {}

  // 处理 date
  if(opt.date) date.value = opt.date
  else date.value = liuUtil.getDefaultDate()

  if(opt.minDate) minDate.value = opt.minDate
  else minDate.value = undefined
  
  if(opt.maxDate) maxDate.value = opt.maxDate
  else maxDate.value = undefined

  _open()

  const _wait = (a: DpResolver): void => {
    _resolve = a
  }

  return new Promise(_wait)
}

function onTapConfirm() {
  _resolve && _resolve({ confirm: true, date: date.value })
  _close()
}

function onTapCancel() {
  _resolve && _resolve({ confirm: false, date: date.value })
  _close()
}

let toggleTimeout: LiuTimeout
function _open() {
  if(show.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  enable.value = true
  toggleTimeout = setTimeout(() => {
    show.value = true
  }, 16)
}

function _close() {
  if(!enable.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  show.value = false
  toggleTimeout = setTimeout(() => {
    enable.value = false
  }, TRANSITION_DURATION)
}