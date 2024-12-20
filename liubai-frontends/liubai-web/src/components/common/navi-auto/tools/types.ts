


export interface NaviAutoData {
  enable: boolean
  show: boolean
  tempHidden: boolean
  shadow: boolean
  lastViewChangedStamp: number
}

export interface NaviAutoProps {
  scrollPosition: number
}

export interface NaviAutoEmits {
  (evt: "naviautochanged", newV: boolean): void
  (evt: "taptitle"): void
}