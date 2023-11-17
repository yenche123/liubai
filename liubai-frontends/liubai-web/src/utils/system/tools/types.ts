import type { LocalLanguage } from "~/types"
import type { LocalTheme } from "~/types/types-atom"

export interface LocalPreference {
  theme?: LocalTheme
  language?: LocalLanguage
  local_id?: string
  token?: string
  serial?: string     // token 所在的序列号
}

export interface LocalOnceData {
  // 读取 iframe-restriction 提示界面后，点击确认时的时间戳
  // 当此值为 undefined 代表从未读过该提示，就去显示提示界面，否则不显示 
  iframeRestriction?: number

  // 使用 GitHub 登录时，一次性的 state，用于防止无关的第三方请求该界面
  githubOAuthState?: string
}

// 存储一些配置信息
export interface LocalConfigData {

}
