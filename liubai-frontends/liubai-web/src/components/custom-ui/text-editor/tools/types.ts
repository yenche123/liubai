

export interface TeData {
  title: string
  title_key: string
  placeholder: string
  placeholder_key: string
  inputTxt: string
  nativeInputTxt: string
  minLength: number
  maxLength: number
  trim: boolean
}

export interface TextEditorSuccessRes {
  confirm: boolean
  cancel: boolean
  value: string      // 注意，如果用户点击取消，该字段仍然会有值；该字段永远反应于用户输入的文字
}

export interface TextEditorParam {
  title?: string
  title_key?: string
  placeholder?: string
  placeholder_key?: string   // t(placeholder_key)
  value?: string          // 用户已输入的文字
  minLength?: number
  maxLength?: number
  trim?: boolean         // 默认为 true
  success?: (res: TextEditorSuccessRes) => void
}

export type TextEditorResolver = (res: TextEditorSuccessRes) => void
