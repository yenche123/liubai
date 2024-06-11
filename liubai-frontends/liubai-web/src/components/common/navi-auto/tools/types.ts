


export interface NaviAutoData {
  enable: boolean
  show: boolean
  shadow: boolean
  backdropFilterAgain: boolean
}

export interface NaviAutoEmits {
  (event: "naviautochangeed", newV: boolean): void
}