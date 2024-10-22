import { SnackbarRes } from "~/types/other/types-snackbar"

export type SbResolver = (res: SnackbarRes) => void

export interface SbData {
  text: string
  text_key: string
  action: string
  action_key: string
  action_color: string
  duration: number
  dot_color: string
  offset: number    // add padding-bottom if bottom-navi-bar exists
  zIndex: number
}