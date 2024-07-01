


export interface NaviAutoData {
  enable: boolean
  show: boolean
  shadow: boolean
}

export interface NaviAutoEmits {
  (event: "naviautochanged", newV: boolean): void
}