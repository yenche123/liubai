

export interface SvProvideInject {
  type: "to_end" | "to_start" | ""
  triggerNum: number
}

export interface SvBottomUp {
  type: "pixel" | "selectors"
  pixel?: number
  selectors?: string
  initPixel?: number   // 当 type 为 selectors 时会使用到，表示整个盒子距离 document 上侧或左侧的距离
  instant?: boolean    // 是否"立即" 滚动到特定位置，默认为 false
  offset?: number      // 当 type 为 selectors 方有效，表示偏移量
}