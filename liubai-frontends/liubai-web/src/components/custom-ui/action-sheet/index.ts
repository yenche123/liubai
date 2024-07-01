import { reactive, ref } from "vue"
import type {
  ActionSheetParam,
  AsSuccessRes,
} from "./tools/types"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import cfg from "~/config"

type AsResolver = (res: AsSuccessRes) => void

const TRANSITION_DURATION = 220
const enable = ref(false)
const show = ref(false)
const asData = reactive<Required<ActionSheetParam>>({
  title_key: "",
  itemList: [],
  cancel_key: "",
})
let _resolve: AsResolver | undefined

export function initActionSheet() {
  return {
    TRANSITION_DURATION,
    enable,
    show,
    asData,
    onTapMask,
    onTapCancel,
    onTapItem
  }
}

export function showActionSheet(opt: ActionSheetParam) {
  asData.title_key = opt.title_key ?? ""
  asData.itemList = opt.itemList
  asData.cancel_key = opt.cancel_key ?? ""

  _open()

  const _wait = (a: AsResolver): void => {
    _resolve = a
  }

  return new Promise(_wait)
}

function onTapMask() {
  _resolve && _resolve({ result: "mask" })
  _close()
}

function onTapCancel() {
  _resolve && _resolve({ result: "cancel_btn" })
  _close()
}

function onTapItem(index: number) {
  _resolve && _resolve({ result: "option", tapIndex: index })
  _close()
}

let toggleTimeout: LiuTimeout
function _open() {
  if(show.value) return
  if(toggleTimeout) clearTimeout(toggleTimeout)
  enable.value = true
  toggleTimeout = setTimeout(() => {
    show.value = true
  }, cfg.frame_duration)
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