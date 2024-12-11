import { SmsStatus } from "~/types/types-view"
import type { LoginByThirdParty } from "../../tools/types"

export interface LpmData {
  current: number
  showEmailSubmit: boolean
  showPhoneSubmit: boolean
  emailVal: string
  phoneVal: string
  smsVal: string
  indicatorData: {
    width: string
    left: string
  }
  loginViaWeChat: boolean
  loginViaGoogle: boolean
  loginViaGitHub: boolean
  btnOne: "phone" | "email"
  smsStatus: SmsStatus
}

export interface LpmProps {
  isSendingEmail: boolean
  isLoggingByPhone: boolean
  smsSendingNum: number
}

export const lpmProps = {
  isSendingEmail: {
    type: Boolean,
    default: false,
  },
  isLoggingByPhone: {     // 是否正在使用手机号 + 短信登录
    type: Boolean,
    default: false,
  },
  smsSendingNum: {
    type: Number,
    default: 0,
  }
}

export interface LpmEmit {
  (evt: "submitemail", email: string): void
  (evt: "requestsmscode", phone: string): void
  (evt: "submitsmscode", phone: string, code: string): void
  (evt: "tapthirdparty", thirdParty: LoginByThirdParty): void
}