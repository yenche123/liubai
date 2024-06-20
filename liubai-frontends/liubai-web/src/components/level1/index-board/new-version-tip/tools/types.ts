
export interface NvtProps {
  expand: boolean
}

export interface NvtEmits {
  (evt: "confirm"): void
  (evt: "cancel"): void
}

export interface NvtData {
  enable: boolean
  show: boolean
}