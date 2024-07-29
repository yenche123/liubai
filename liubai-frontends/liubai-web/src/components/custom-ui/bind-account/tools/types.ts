


export type BindType = "ww_qynb" | "wx_gzh"

export interface BindAccountParam {
  bindType: BindType
}

export interface BindAccountData {
  show: boolean
  enable: boolean
  bindType?: BindType
  qr_code: string
  pic_url: string
  runTimes: number
}

export type BindAccountRes = boolean

export type BaResolver = (res: BindAccountRes) => void