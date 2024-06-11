


export interface NaviAutoData {
  enable: boolean
  show: boolean
  shadow: boolean
  showBackdropFilter: boolean
}

export interface NaviAutoEmits {
  (event: "naviautochangeed", newV: boolean): void
}