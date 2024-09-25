


export type BindType = "ww_qynb" | "wx_gzh" | "wx_gzh_scan" | "union_pay"

export interface QpParam {
  bindType: BindType
  state?: string         // for login
  fr?: string
  order_id?: string      // for union pay
}

export interface QpData {
  show: boolean
  enable: boolean
  bindType?: BindType
  order_id?: string
  qr_code: string
  pic_url: string
  runTimes: number
  loading: boolean
  state?: string
  fr?: string
  reloadRotateDeg: number
}

export interface QpResult {
  resultType: "plz_check" | "cancel" | "error"
  credential?: string
  credential_2?: string
}

export type QpResolver = (res: QpResult) => void