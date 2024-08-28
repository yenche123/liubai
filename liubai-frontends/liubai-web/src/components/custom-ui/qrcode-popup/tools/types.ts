


export type BindType = "ww_qynb" | "wx_gzh" | "wx_gzh_scan"

export interface QpParam {
  bindType: BindType
  state?: string         // for login
}

export interface QpData {
  show: boolean
  enable: boolean
  bindType?: BindType
  qr_code: string
  pic_url: string
  runTimes: number
  loading: boolean
  state?: string
}

export interface QpResult {
  resultType: "plz_check" | "cancel" | "error"
  credential?: string
  credential_2?: string
}

export type QpResolver = (res: QpResult) => void