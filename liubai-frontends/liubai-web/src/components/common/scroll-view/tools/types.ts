import type { PropType } from "vue"

export interface SvProps {
  upperThreshold: number
  lowerThreshold: number
  direction: "vertical" | "horizontal"
  hiddenScrollBar: boolean
  goToTop: number
}

export const svProps = {
  upperThreshold: {
    type: Number,
    default: 150
  },
  lowerThreshold: {
    type: Number,
    default: 150
  },
  direction: {
    type: String as PropType<"vertical" | "horizontal">,
    default: "vertical",
  },
  hiddenScrollBar: {
    type: Boolean,
    default: false,
  },
  goToTop: {
    type: Number,
    default: 0,
  }
}

export interface SvEmits {
  // 滚动时，已做防抖节流
  (event: "scroll", data: { scrollPosition: number }): void
  (event: "scrolltoend", data: { scrollPosition: number }): void
  (event: "scrolltostart", data: { scrollPosition: number }): void
  // 下拉刷新被触发
  (event: "refresh"): void
}

// 默认、下拉中、加载中、松开跑回去
export type RefreshState = "default" | "pulling" | "loading" | "loosing"
