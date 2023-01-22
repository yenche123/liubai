// 一些自定义的 util
import type { WhatDetail } from "~/types/other/types-custom"
import { useWindowSize } from "~/hooks/useVueUse"

export function toWhatDetail(): WhatDetail {
  const { width } = useWindowSize()
  if(width.value < 901) return "detail-page"
  return "vice-view"
}