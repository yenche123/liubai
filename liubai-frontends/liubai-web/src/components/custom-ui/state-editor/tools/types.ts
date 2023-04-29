export type StateEditorMode = "create" | "edit"

export interface StateEditorData {
  mode: StateEditorMode | ""
  canSubmit: boolean
  text: string
  showInIndex: boolean
  showFireworks: boolean
  color: string
}

export interface StateEditorParam {
  mode: StateEditorMode
  text?: string
  showInIndex?: boolean
  showFireworks?: boolean
  color?: string    // 可以包含 var() 也可以不包含，组件内部会自适应
}

export interface StateEditorRes {
  action: "confirm" | "cancel"
  data?: {
    text: string
    showInIndex: boolean
    showFireworks: boolean
    color: string   // 必定为纯 CSS 变量，不会包含 var()
  }
}

export type SeResolver = (res: StateEditorRes) => void