


export interface A2hsTipProps {
  a2hs: boolean
}

export interface A2hsTipEmits {
  (evt: "tapinstall"): void
  (evt: "tapclose"): void
}

export interface AtData {
  enable: boolean
  show: boolean
}