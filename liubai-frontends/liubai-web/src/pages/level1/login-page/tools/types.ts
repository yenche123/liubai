import type { MemberShow } from "~/types/types-content"


export type LoginByThirdParty = "google" | "github" | "apple"

export interface LpData {
  view: "main" | "code" | "accounts"     // 主页、填写验证码、选择账号
  accounts: MemberShow[]

  // email 相关
  email: string
  isSendingEmail: boolean
  lastSendEmail?: number         // 最近一次发送 email 验证码的时间戳
  isSubmittingEmailCode: boolean
  lastSubmitEmailCode?: number   // 最近一次提交 email 和 验证码的时间戳

  // 从后端获取
  publicKey?: string
  githubOAuthClientId?: string
  googleOAuthClientId?: string
  state?: string
  initCode?: string           // 调用 login 接口 init 时，返回的 code
  initStamp?: number          // 调用 login 接口 init 后的时间戳

  googleOneTapShown?: boolean  // 是否当前 google one tap 被展示着

}