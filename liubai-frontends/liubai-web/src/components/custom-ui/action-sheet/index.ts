import { reactive, ref } from "vue"
import valTool from "~/utils/basic/val-tool"

interface ActionSheetItem {
  text?: string
  text_key?: string
  iconName?: string
  color?: string
}

interface ActionSheetParam {
  title_key?: string
  itemList: ActionSheetItem[]
  cancel_key?: string          // 自定义 "取消" 文案
}

interface AsSuccessRes {
  result: "option" | "mask" | "cancel_btn"     // 点击了 "选项" / "蒙层" / "取消按钮"
  tapIndex?: number
}

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

export async function showActionSheet(opt: ActionSheetParam) {
  asData.title_key = opt.title_key ?? ""
  asData.itemList = opt.itemList
  asData.cancel_key = opt.cancel_key ?? ""

  await _open()

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


async function _open() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function _close() {
  if(!show.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}