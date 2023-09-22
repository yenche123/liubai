import { nextTick, toRef, watch } from "vue";
import liuUtil from "~/utils/liu-util";
import type { SearchEditorData } from "../../tools/types";

interface SearchResultsProps {
  seData: SearchEditorData
}

export function useSearchResults(
  props: SearchResultsProps
) {
  const seData = props.seData
  const indicator = toRef(seData, "indicator")

  watch(indicator, async (newV, oldV) => {
    if(!newV) return
    await nextTick()
    const el = document.querySelector(".si-container_selected")
    if(!el) return
    const parent = document.querySelector(".sr-container")
    if(!parent) return
    liuUtil.makeBoxScrollToShowChild(parent, el)
  })
}