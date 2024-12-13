import type { SmsStatus } from "~/types/types-view"


export type BpType = "phone" | "email"

export interface BpParam {
  bindType: BpType
  compliance: boolean
}

export interface BpData {
  bindType: BpType
  compliance: boolean
  enable: boolean
  show: boolean
  sendCodeStatus: SmsStatus
  firstInputVal: string
  secondInputVal: string
  firstErr?: string
  secondErr?: string
  canSubmit: boolean
  btnLoading: boolean
  btnErr?: string
}

export interface BpResult {
  bound: boolean
}

export type BpResolver = (res: BpResult) => void