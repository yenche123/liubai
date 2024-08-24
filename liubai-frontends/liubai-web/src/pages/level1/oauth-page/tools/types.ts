


export interface OpData {
  via: "github" | "google" | "wechat" | "err" | ""
  code: string
  showLoading: boolean
  errTitle?: string
  errTitleKey?: string
  errMsg?: string
  errMsgKey?: string
}