import type { LoginByThirdParty } from "../../tools/types"

export interface LpmData {
  current: number
  showEmailSubmit: boolean
  emailVal: string
  indicatorData: {
    width: string
    left: string
  }
  loginViaWeChat: boolean
  loginViaGoogle: boolean
  loginViaGitHub: boolean
}

export interface LpmProps {
  isSendingEmail: boolean
}

export const lpmProps = {
  isSendingEmail: {
    type: Boolean,
    default: false,
  }
}

export interface LpmEmit {
  (evt: "submitemail", email: string): void
  (evt: "tapthirdparty", thirdParty: LoginByThirdParty): void
}