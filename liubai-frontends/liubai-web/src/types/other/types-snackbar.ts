


export interface SnackbarParam {
  text?: string
  text_key?: string
  action?: string
  action_key?: string
  action_color?: string
  duration?: number
}

export interface SnackbarRes {
  result: "auto" | "tap"
}