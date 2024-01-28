import { reactive, ref } from "vue"
import valTool from "~/utils/basic/val-tool"
import { 
  toListenEnterKey, 
  cancelListenEnterKeyUp, 
  toListenEscKeyUp, 
  cancelListenEscKeyUp
} from "../../tools/listen-keyup"
import type {
  ModalSuccessRes,
  ModalParam,
  ModalData,
  ModalResolver,
} from "./types"

let _success: ModalResolver | undefined
let _resolve: ModalResolver | undefined

const enable = ref(false)
const show = ref(false)
const TRANSITION_DURATION = 120 // 200

const modalData = reactive<ModalData>({
  title: "",
  title_key: "",
  content: "",
  content_key: "",
  showCancel: true,
  cancelText: "",
  confirmText: "",
  tipSelected: false,
  modalType: "normal"
})

async function _openModal() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
  toListenEnterKey(onTapConfirm)
  toListenEscKeyUp(onTapCancel)
}

async function _closeModal() {
  if(!show.value) return
  show.value = false

  cancelListenEnterKeyUp()
  cancelListenEscKeyUp()

  await valTool.waitMilli(TRANSITION_DURATION)
  if(show.value) return
  enable.value = false
}

async function onTapConfirm() {
  const res: ModalSuccessRes = {
    confirm: true, 
    cancel: false, 
    tapType: "confirm",
  }
  if(modalData.tip_key) res.tipToggle = modalData.tipSelected
  _resolve && _resolve(res)
  _resolve = undefined
  _success && _success(res)
  _success = undefined
  _closeModal()
}

async function onTapCancel() {
  const res: ModalSuccessRes = {
    confirm: false, 
    cancel: true, 
    tapType: "cancel",
  }
  if(modalData.tip_key) res.tipToggle = modalData.tipSelected
  _resolve && _resolve(res)
  _resolve = undefined
  _success && _success(res)
  _success = undefined
  _closeModal()
}

const onTapTip = () => {
  modalData.tipSelected = !modalData.tipSelected
}

export function initModal() {
  return { 
    enable, 
    show, 
    TRANSITION_DURATION, 
    modalData, 
    onTapConfirm, 
    onTapCancel,
    onTapTip,
  }
}

export async function showModal(
  opt: ModalParam
): Promise<ModalSuccessRes> {

  modalData.title = opt.title ?? ""
  modalData.content = opt.content ?? ""
  modalData.title_key = opt.title_key ?? ""
  modalData.content_key = opt.content_key ?? ""
  modalData.cancelText = opt.cancelText ?? ""
  modalData.confirmText = opt.confirmText ?? ""
  modalData.confirm_key = opt.confirm_key
  modalData.cancel_key = opt.cancel_key
  modalData.title_opt = opt.title_opt
  modalData.content_opt = opt.content_opt
  modalData.tip_key = opt.tip_key
  modalData.tipSelected = false
  modalData.modalType = opt.modalType ?? "normal"
  modalData.isTitleEqualToEmoji = opt.isTitleEqualToEmoji ?? false

  if(typeof opt.showCancel === "boolean") {
    modalData.showCancel = opt.showCancel
  }
  else {
    modalData.showCancel = true
  }

  if(opt.success) {
    _success = opt.success
  }
  else {
    _success = undefined
  }

  await _openModal()

  const _wait = (a: ModalResolver): void => {
    _resolve = a
  }

  return new Promise(_wait)
}