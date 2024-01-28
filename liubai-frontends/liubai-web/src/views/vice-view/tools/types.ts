import type { OpenType } from "~/types/types-view";

export interface VvData {
  openType: OpenType
  intendedMinVvPx: number
  minVvPx: number
  viceViewPx: number
  vvHeightPx: number
  maxVvPx: number
  isAnimating: boolean
  isActivate: boolean
  lastParentResizeStamp: number
  lastOpenStamp: number
  shadow: boolean
}

export interface VvEmits {
  (e: "widthchange", widthPx: number): void
}