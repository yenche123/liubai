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
}

export interface LpmProps {
  isSendingEmail: boolean
}

export const lpmProps = {
  isSendingEmail: {
    type: Boolean,
    default: false,
  },
  isSendingSMS: {         // 是否正在传送验证码
    type: Boolean,
    default: false,
  },
  isLoggingByPhone: {     // 是否正在使用手机号 + 短信登录
    type: Boolean,
    default: false,
  }
}

export interface LpmEmit {
  (evt: "submitemail", email: string): void
  (evt: "submitphone", phone: string): void
  (evt: "submitsmscode", phone: string, code: string): void
  (evt: "tapthirdparty", thirdParty: LoginByThirdParty): void
}