


export interface LpcProps {
  email: string
  clearCodeNum: number
  isSubmittingCode: boolean
}

export interface LpcEmits {
  (evt: "submitcode", code: string): void
  (evt: "back"): void
}

export interface LpcData {
  code: string
  canSubmit: boolean
}