

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