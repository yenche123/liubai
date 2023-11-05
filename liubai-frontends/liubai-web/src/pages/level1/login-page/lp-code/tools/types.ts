


export interface LpcProps {
  email: string
}

export interface LpcEmits {
  (evt: "submitcode", code: string): void
  (evt: "back"): void
}

export interface LpcData {
  code: string
  canSubmit: boolean
}