import type { ScTopItemKey } from "../../tools/types"

export interface ScTopProps {
  isFixed: boolean
}

export const scTopProps = {
  isFixed: {
    type: Boolean,
    default: false,
  }
}

export interface ScTopEmits {
  (evt: "canclosepopup"): void
  (evt: "mouseenter", key: ScTopItemKey): void
  (evt: "mouseleave"): void
}

export type SctIndicator = "notification" | "setting" | "trash" | ""