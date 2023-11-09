


export interface OpData {
  via: "github" | "google" | "err" | ""
  code: string
  showLoading: boolean
  errTitle?: string
  errTitleKey?: string
  errMsg?: string
  errMsgKey?: string
}