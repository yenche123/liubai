import type { MemberShow } from "~/types/types-content"


export type LoginByThirdParty = "google" | "github" | "apple"

export type LpView = "main" | "code" | "accounts"     // 主页、填写验证码、选择账号

export interface LpData {
  enable: boolean
  view: LpView
  accounts: MemberShow[]

  // 一些配置
  openWithBrowser: boolean

  // email 相关
  email: string
  isSendingEmail: boolean
  lastSendEmail?: number         // 最近一次请求后端去发送 email 验证码的时间戳
  isSubmittingEmailCode: boolean
  clearCodeNum: number

  // 从后端获取
  publicKey?: string
  githubOAuthClientId?: string
  googleOAuthClientId?: string
  state?: string
  initCode?: string           // 调用 login 接口 init 时，返回的 code
  initStamp?: number          // 调用 login 接口 init 后的时间戳

  googleOneTapShown?: boolean  // 是否当前 google one tap 被展示着

  // 多用户选择 相关
  multi_credential?: string
  multi_credential_id?: string
  isSelectingAccount: boolean     // 是否已选择用户，并在等待后端响应
  
  lastLogged?: number             // 已确定登录的时间戳，这个时候去等待 router 切换
                                  // 这个时间戳是避免用户在等待时重复登录

}