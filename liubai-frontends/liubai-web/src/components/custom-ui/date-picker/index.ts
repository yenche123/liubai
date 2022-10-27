import { computed, reactive, ref } from "vue"
import valTool from "../../../utils/basic/val-tool"
import liuUtil from "../../../utils/liu-util"

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
    onTapCancel
  }
}

export async function showDatePicker(opt?: DatePickerParam): Promise<DpSuccessRes> {
  if(!opt) opt = {}

  // 处理 date
  if(opt.date) date.value = opt.date
  else date.value = liuUtil.getDefaultDate()

  if(opt.minDate) minDate.value = opt.minDate
  else minDate.value = undefined
  
  if(opt.maxDate) maxDate.value = opt.maxDate
  else maxDate.value = undefined

  await _openDatePicker()

  const _wait = (a: DpResolver): void => {
    _resolve = a
  }

  return new Promise(_wait)
}

function onTapConfirm() {
  _resolve && _resolve({ confirm: true, date: date.value })
  _closeDatePicker()
}

function onTapCancel() {
  _resolve && _resolve({ confirm: false, date: date.value })
  _closeDatePicker()
}

async function _openDatePicker() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function _closeDatePicker() {
  if(!show.value) return
  show.value = false

  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}