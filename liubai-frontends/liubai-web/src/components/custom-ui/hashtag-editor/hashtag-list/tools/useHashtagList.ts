import { nextTick, toRef, useTemplateRef, watch } from "vue";
import liuUtil from "~/utils/liu-util";
import type { TagItem } from "../../tools/types";

interface HtlProps {
  list: TagItem[]
  selectedIndex: number
}

export function useHashtagList(props: HtlProps) {
  // 处理 selectedIndex 变化时，让被选中的选项进入可视区域

  const htListEl = useTemplateRef<HTMLElement>("htListEl")
  const selectedIndex = toRef(props, "selectedIndex")
  
  watch(selectedIndex, async (newV, oldV) => {
    if(newV < 0) return
    await nextTick()

    const parent = htListEl.value
    if(!parent) return
    const el = parent.querySelector(".ht-item_selected")
    if(!el) return

    liuUtil.makeBoxScrollToShowChild(parent, el)
  })

  return {
    htListEl,
  }
}