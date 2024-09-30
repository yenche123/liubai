import { nextTick, toRef, watch, useTemplateRef } from "vue";
import liuUtil from "~/utils/liu-util";
import type { SearchEditorData } from "../../tools/types";
import time from "~/utils/basic/time"

interface SearchResultsProps {
  seData: SearchEditorData
}

export function useSearchResults(
  props: SearchResultsProps
) {
  const srContainerEl = useTemplateRef<HTMLElement>("srContainerEl")
  const seData = props.seData
  const indicator = toRef(seData, "indicator")
  const initStamp = time.getTime()

  watch(indicator, async (newV, oldV) => {
    if(!newV) return

    // 避免打开时的快速滚动，故做一个防抖节流
    if(time.isWithinMillis(initStamp, 500)) return

    await nextTick()

    const parent = srContainerEl.value
    if(!parent) return
    const el = parent.querySelector(".si-container_selected")
    if(!el) return

    liuUtil.makeBoxScrollToShowChild(parent, el)
  })

  return {
    srContainerEl,
  }
}