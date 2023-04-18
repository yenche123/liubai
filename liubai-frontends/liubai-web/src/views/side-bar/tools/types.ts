import type { OpenType } from "~/types/types-view";

export interface SbData {
  openType: OpenType
  minSidebarPx: number
  sidebarWidthPx: number
  sidebarHeightPx: number
  maxSidebarPx: number
  isAnimating: boolean
  isActivate: boolean
  showHandle: boolean
} 