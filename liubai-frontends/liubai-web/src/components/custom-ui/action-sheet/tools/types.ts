

export interface ActionSheetItem {
  text?: string
  text_key?: string
  iconName?: string
  color?: string
}

export interface ActionSheetParam {
  title_key?: string
  itemList: ActionSheetItem[]
  cancel_key?: string          // 自定义 "取消" 文案
}

export interface AsSuccessRes {
  result: "option" | "mask" | "cancel_btn"     // 点击了 "选项" / "蒙层" / "取消按钮"
  tapIndex?: number
}