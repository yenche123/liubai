import { ref } from "vue"
import valTool from "../../../utils/basic/val-tool"

interface DpSuccessRes {
  confirm: boolean
  date?: Date
}

type DpResolver = (res: DpSuccessRes) => void

const TRANSITION_DURATION = 120
const enable = ref(false)
const show = ref(false)
const _date = ref<Date | undefined>()

let _resolve: DpResolver | undefined

export function initDatePicker() {
  return { enable, show, _date, TRANSITION_DURATION, onTapConfirm, onTapCancel }
}

export async function showDatePicker(): Promise<DpSuccessRes> {
  await _openDatePicker()

  const _wait = (a: DpResolver): void => {
    _resolve = a
  }

  return new Promise(_wait)
}

function onTapConfirm() {

  console.log("onTapConfirm..........")

}

function onTapCancel() {

}


async function _openDatePicker() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}