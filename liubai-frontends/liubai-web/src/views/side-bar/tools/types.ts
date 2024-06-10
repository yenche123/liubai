import type { CursorHorizontalResize, OpenType } from "~/types/types-view";

export interface SbData {
  enable: boolean
  openType: OpenType
  minSidebarPx: number
  sidebarWidthPx: number
  sidebarHeightPx: number
  maxSidebarPx: number
  isAnimating: boolean
  isActivate: boolean
  showHandle: boolean
  cursor: CursorHorizontalResize
} 