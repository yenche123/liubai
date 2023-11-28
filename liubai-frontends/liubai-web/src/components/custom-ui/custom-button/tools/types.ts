import type { PropType } from "vue"
import type { LiuTimeout } from "~/utils/basic/type-tool"

type CustomBtnType = "main" | "other" | "transparent" | "pure"
type CustomBtnSize = "normal" | "mini" | "common"

export interface CustomBtnProps {
  type: CustomBtnType
  size: CustomBtnSize
  disabled: boolean
  zIndex?: number
  width?: string
  isLoading: boolean
}

export interface CustomBtnData {
  enableLoading: boolean
  showLoading: boolean
  showingTimeout: LiuTimeout
  closingTimeout: LiuTimeout
}

export const customBtnProps = {
  type: {
    type: String as PropType<CustomBtnType>,
    default: "main",     // main: 主要的;  other: 一般的;  transparent: 透明的; 
                         // pure: 纯白的（浅色模式时），或纯黑的（深色模式时）
  },
  size: {
    type: String as PropType<CustomBtnSize>,
    default: "normal",   // normal: 正常大小;  mini: 宽度同 slot; 
                         // common: 宽度同 slot 但是高度是 50px
  },
  disabled: {
    type: Boolean,
    default: false
  },
  zIndex: Number,
  width: String,
  isLoading: {
    type: Boolean,
    default: false,
  }
}