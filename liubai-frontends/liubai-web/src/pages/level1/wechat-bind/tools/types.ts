import type { PageState } from "~/types/types-atom";
import type { Res_UserLoginInit } from "~/requests/req-types";

// logout: 微信一键登录
// waiting: 绑定微信（已登录）
// bound: 已绑定（按钮: 返回）
// logged: 登录成功（并且也绑定了）

export type WbStatus = "logout" | "waiting" | "bound" | "logged"

export interface WbData {
  pageState: PageState
  oAuthCode: string
  status?: WbStatus
  loginData?: Res_UserLoginInit
}