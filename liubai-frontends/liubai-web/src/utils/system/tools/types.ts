import type { LocalTheme } from "~/types/types-atom"
import type { Res_UserLoginInit } from "~/requests/req-types"
import type { LocalLocale } from "~/types/types-locale"

export interface LocalPreference {
  theme?: LocalTheme
  language?: LocalLocale
  local_id?: string
  open_id?: string
  token?: string
  serial?: string       // token 所在的序列号
  client_key?: string   // 前端生成的 aes 密钥
}

export interface LocalOnceData {
  // 读取 iframe-restriction 提示界面后，点击确认时的时间戳
  // 当此值为 undefined 代表从未读过该提示，就去显示提示界面，否则不显示 
  iframeRestriction?: number

  // 使用 GitHub 登录时，一次性 state，用于防止无关的第三方请求该界面
  githubOAuthState?: string

  // 使用 Google 登录时，一次性 state
  googleOAuthState?: string

  // 前端生成的 aes 密钥
  client_key?: string

  // 前端用后端公钥加密前端的 aes 的结果
  enc_client_key?: string

  // whether you want to open vConsole
  mobile_debug?: boolean

  // a2hs
  a2hs_never_prompt?: boolean
  a2hs_last_cancel_stamp?: number

  // service worker
  lastCheckSWStamp?: number
  lastInstallNewVersion?: number     // last stamp to install new version
  lastConfirmNewVersion?: number     // last stamp to confirm new version
  lastCancelNewVersion?: number      // last stamp to cancel new version

  // goto using in login-page
  goto?: string

}

export type KeyOfLocalOnceData = keyof LocalOnceData

// 存储一些配置信息
export interface LocalConfigData {

  // 登录时的 配置信息
  userLoginInitStamp?: number
  userloginInitCfg?: Res_UserLoginInit
  
}
