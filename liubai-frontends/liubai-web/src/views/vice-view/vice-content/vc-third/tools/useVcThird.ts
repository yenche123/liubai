import type { VcThirdProps } from "./types";
import type { VcThirdParty } from "../../tools/types";
import { computed } from 'vue';

export function useVcThird(props: VcThirdProps) {
  // 是否覆盖整个 vice-view
  const COVER_REQUIRED: VcThirdParty[] = ['calendly']
  const isCoverVv = computed(() => {
    const thirdParty = props.thirdParty
    if(!thirdParty) return false
    return COVER_REQUIRED.includes(thirdParty)
  })

  // 微调 8px，因为 8px 的误差仅在 iframe 上出现
  const maskMarginTop2 = computed(() => {
    const m = props.maskMarginTop
    if(!m) return m
    return m + 8
  })

  return {
    isCoverVv,
    maskMarginTop2,
  }
}