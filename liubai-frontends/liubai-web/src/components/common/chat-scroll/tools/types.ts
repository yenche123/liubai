import type { PropType, Ref, ShallowRef } from "vue"
import type { TrueOrFalse } from "~/types/types-basic"

export interface CsProps {
  hiddenScrollBar: boolean
  showTxt?: TrueOrFalse     // 当一个页面里，有多个自定义的 view 时，需传递此值
                            // 为什么不单纯地传递布尔值 true / false 呢？因为 undefined 时默认为 false
}

export const csProps = {
  hiddenScrollBar: {
    type: Boolean,
    default: false,
  },
  showTxt: {
    type: String as PropType<TrueOrFalse>,
  },
}

export interface CsEmits {
  // 滚动时，已做防抖节流
  (event: "scroll", data: { scrollPosition: number }): void
  (event: "scrolltoend", data: { scrollPosition: number }): void    // 滚动到最“顶部”时触发
  (event: "scrolltostart", data: { scrollPosition: number }): void  // 滚动到最“底部”时触发
}


export interface CsData {
  scrollPosition: number
  lastToggleViewStamp: number
  isVisible: boolean
}

export interface CsCtx {
  props: CsProps
  emits: CsEmits
  cs: Readonly<ShallowRef<HTMLElement | null>>
  csData: CsData
}

