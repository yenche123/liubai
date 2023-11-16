import type { MemberShow } from "~/types/types-content"


export type LoginByThirdParty = "google" | "github" | "apple"

export interface LpData {
  view: "main" | "code" | "accounts"     // 主页、填写验证码、选择账号
  email: string
  accounts: MemberShow[]

  // 从后端获取
  publicKey?: string
  githubOAuthClientId?: string
  googleOAuthClientId?: string
  initCode?: string           // 调用 login 接口 init 时，返回的 code

}