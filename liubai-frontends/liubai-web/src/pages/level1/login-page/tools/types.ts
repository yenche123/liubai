import type { MemberShow } from "~/types/types-content"

export interface LpData {
  view: "main" | "code" | "accounts"     // 主页、填写验证码、选择账号
  email: string
  accounts: MemberShow[]
}