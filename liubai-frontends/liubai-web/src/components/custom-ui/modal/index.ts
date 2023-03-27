
import { reactive, ref } from "vue"
import valTool from "~/utils/basic/val-tool"
import { toListenEnterKeyUp, cancelListenEnterKeyUp } from "../tools/listen-keyup"

interface ModalSuccessRes {
  confirm: boolean
  cancel: boolean
  tipToggle?: boolean
  tapType: "confirm" | "cancel" | "mask"     // 目前不会有 mask 选项
}

interface ModalParam {
  title?: string
  content?: string
  title_key?: string      // 用于 i18n
  content_key?: string    // 用于 i18n
  title_opt?: Record<string, any>    // 用于 i18n t() 函数的第二个参数
  content_opt?: Record<string, any>  // 用于 i18n t() 函数的第二个参数
  tip_key?: string        // content 下方一排小字让用户勾选
  showCancel?: boolean
  cancelText?: string
  confirmText?: string
  confirm_key?: string
  cancel_key?: string
  modalType?: "normal" | "warning"
  success?: (res: ModalSuccessRes) => void
}

interface ModalData {
  title: string
  title_key: string
  title_opt?: Record<string, any>
  content: string
  content_key: string
  content_opt?: Record<string, any>
  tip_key?: string
  showCancel: boolean
  cancelText: string
  confirmText: string
  confirm_key?: string
  cancel_key?: string
  modalType?: "normal" | "warning"
  tipSelected: boolean
}

type ModalResolver = (res: ModalSuccessRes) => void

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

const _openModal = async (): Promise<void> => {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
  toListenEnterKeyUp(onTapConfirm)
}

const _closeModal = async (): Promise<void> => {
  if(!show.value) return
  show.value = false

  cancelListenEnterKeyUp()

  await valTool.waitMilli(TRANSITION_DURATION)
  if(show.value) return
  enable.value = false
}

const onTapConfirm = (): void => {
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

const onTapCancel = (): void => {
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

const initModal = () => {
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

const showModal = async (opt: ModalParam): Promise<ModalSuccessRes> => {

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

export {
  initModal,
  showModal,
}