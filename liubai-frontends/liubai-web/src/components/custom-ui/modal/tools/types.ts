



export interface ModalSuccessRes {
  confirm: boolean
  cancel: boolean
  tipToggle?: boolean
  tapType: "confirm" | "cancel" | "mask"     // 目前不会有 mask 选项
}

export interface ModalParam {
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
  isTitleEqualToEmoji?: boolean
  iconName?: string
  iconUrl?: string
  success?: (res: ModalSuccessRes) => void
}

export interface ModalData {
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
  isTitleEqualToEmoji?: boolean
  iconName?: string
  iconUrl?: string
  tipSelected: boolean
}

export type ModalResolver = (res: ModalSuccessRes) => void