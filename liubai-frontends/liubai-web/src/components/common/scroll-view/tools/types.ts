

export interface SvProps {
  upperThreshold: number
  lowerThreshold: number
}

export interface SvEmits {
  (event: "scroll", data: { scrollTop: number }): void
  (event: "scrolltolower", data: { scrollTop: number }): void
  (event: "scrolltoupper", data: { scrollTop: number }): void
  (event: "refresh"): void
}

// 默认、下拉中、加载中、松开跑回去
export type RefreshState = "default" | "pulling" | "loading" | "loosing"

export interface SvProvideInject {
  type: "to_lower" | "to_upper" | ""
  triggerNum: number
}