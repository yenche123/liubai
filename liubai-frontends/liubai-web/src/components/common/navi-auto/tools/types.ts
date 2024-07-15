


export interface NaviAutoData {
  enable: boolean
  show: boolean
  shadow: boolean
}

export interface NaviAutoProps {
  scrollPosition: number
}

export interface NaviAutoEmits {
  (evt: "naviautochanged", newV: boolean): void
  (evt: "taptitle"): void
}