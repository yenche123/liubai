// 一些自定义的 util
import type { WhatDetail } from "~/types/other/types-custom"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"

export function toWhatDetail(): WhatDetail {
  const { width } = useWindowSize()
  if(width.value < cfg.vice_detail_breakpoint) return "detail-page"
  return "vice-view"
}