import { nextTick, toRef, watch, ref } from "vue";
import liuUtil from "~/utils/liu-util";
import type { SearchEditorData } from "../../tools/types";

interface SearchResultsProps {
  seData: SearchEditorData
}

export function useSearchResults(
  props: SearchResultsProps
) {
  const srContainerEl = ref<HTMLElement>()
  const seData = props.seData
  const indicator = toRef(seData, "indicator")

  watch(indicator, async (newV, oldV) => {
    if(!newV) return
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