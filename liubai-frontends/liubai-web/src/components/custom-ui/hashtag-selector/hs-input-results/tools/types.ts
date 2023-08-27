
export interface HsirData {
  focus: boolean
  inputTxt: string
}

export interface HsirEmit {
  (evt: "focusornot", focus: boolean): void
}