


export interface LpmData {
  current: number
  showEmailSubmit: boolean
  emailVal: string
  indicatorData: {
    width: string
    left: string
  }
}

export interface LpmEmit {
  (evt: "submitemail", email: string): void
}