import { type PropType } from 'vue';

export interface SbProps {
  show: boolean
  mode: "fixed" | "common"
}

export const sbProps = {
  show: {
    type: Boolean,
    default: true,
  },
  mode: {
    type: String as PropType<"fixed" | "common">,
    default: "common"
  },
}

export interface SbEmits {
  (evt: "canclosepopup"): void
}

export interface SbcCursorInfo {
  enable: boolean
  show: boolean
  width: number
  height: number
  x: number
  y: number
}

export type ScTopItemKey = "search" | "notification" | "setting"
  | "trash" | "more"