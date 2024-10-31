import type { PropType, Ref, ShallowRef } from "vue"
import type { TrueOrFalse } from "~/types/types-basic"

export interface SvProps {
  upperThreshold: number
  lowerThreshold: number
  direction: "vertical" | "horizontal"
  hiddenScrollBar: boolean
  goToTop: number
  showTxt?: TrueOrFalse     // 当一个页面里，有多个自定义的 view 时，需传递此值
                            // 为什么不单纯地传递布尔值 true / false 呢？因为 undefined 时默认为 false
  considerBottomNaviBar: boolean
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
  },
  showTxt: {
    type: String as PropType<TrueOrFalse>,
  },
  considerBottomNaviBar: {
    type: Boolean,
    default: false,
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

export interface SvData {
  offset: number
}

export interface SvCtx {
  props: SvProps
  emits: SvEmits
  scrollPosition: Ref<number>
  sv: Readonly<ShallowRef<HTMLElement | null>>
  lastToggleViewStamp: Ref<number>
  isVisible: Ref<boolean>
  svData: SvData
}

