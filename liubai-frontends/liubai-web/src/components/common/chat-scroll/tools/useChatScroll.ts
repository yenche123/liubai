import { reactive, useTemplateRef } from "vue";
import type { CsCtx, CsData, CsEmits, CsProps } from "./types";
import time from "~/utils/basic/time";


export function useChatScroll(
  props: CsProps,
  emits: CsEmits,
) {
  // 1. init data
  const cs = useTemplateRef<HTMLDivElement>("cs")
  const csData = reactive<CsData>({
    scrollPosition: 0,
    lastToggleViewStamp: time.getLocalTime(),
    isVisible: true,
  })
  const ctx: CsCtx = {
    props,
    emits,
    cs,
    csData,
  }

  return {
    cs,
    csData,
  }
}