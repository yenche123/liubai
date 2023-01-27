

export interface StateSelectorParam {
  stateIdSelected?: string
}

export interface StateSelectorRes {
  action: "confirm" | "mask" | "remove"
  stateId?: string
}

export type SsResolver = (res: StateSelectorRes) => void

export interface SsItem {
  text?: string
  text_key?: string
  color: string
}