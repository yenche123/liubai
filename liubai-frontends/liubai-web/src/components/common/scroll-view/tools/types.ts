

export interface SvProps {
  upperThreshold: number
  lowerThreshold: number
  direction: "vertical" | "horizontal"
  hiddenScrollBar: boolean
  goToTop: number
}

export interface SvEmits {
  (event: "scroll", data: { scrollPosition: number }): void
  (event: "scrolltoend", data: { scrollPosition: number }): void
  (event: "scrolltostart", data: { scrollPosition: number }): void
  (event: "refresh"): void
}

// 默认、下拉中、加载中、松开跑回去
export type RefreshState = "default" | "pulling" | "loading" | "loosing"

export interface SvProvideInject {
  type: "to_end" | "to_start" | ""
  triggerNum: number
}

export interface SvBottomUp {
  type: "pixel" | "selectors"
  pixel?: number
  selectors?: string
  initPixel?: number   // 当 type 为 selectors 时会使用到，表示整个盒子距离 document 上侧或左侧的距离
}