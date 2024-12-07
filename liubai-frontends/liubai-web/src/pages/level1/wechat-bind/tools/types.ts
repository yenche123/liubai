import type { PageState } from "~/types/types-atom";

// logout: 微信一键登录
// waiting: 绑定微信（已登录）
// success: 已绑定（按钮: 返回）

export type WbStatus = "logout" | "waiting" | "success"

export interface WbData {
  pageState: PageState
  oAuthCode: string
  status?: WbStatus
}