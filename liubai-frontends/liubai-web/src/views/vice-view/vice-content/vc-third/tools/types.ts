import type { VcThirdParty } from "../../tools/types"

export interface VcThirdProps {
  isOutterDraging: boolean
  thirdParty?: VcThirdParty
  link?: string
  vcHeight: number
  viceNaviPx: number
  maskMarginTop: number
}