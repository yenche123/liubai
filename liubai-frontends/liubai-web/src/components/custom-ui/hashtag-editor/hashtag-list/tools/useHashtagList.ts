import { nextTick, toRef, watch } from "vue";
import liuUtil from "~/utils/liu-util";
import type { TagItem } from "../../tools/types";

interface HtlProps {
  list: TagItem[]
  selectedIndex: number
}

export function useHashtagList(props: HtlProps) {
  // 处理 selectedIndex 变化时，让被选中的选项进入可视区域

  const selectedIndex = toRef(props, "selectedIndex")
  watch(selectedIndex, async (newV, oldV) => {
    if(newV < 0) return
    await nextTick()
    const el = document.querySelector(".ht-item_selected")
    if(!el) return
    const parent = document.querySelector(".ht-list")
    if(!parent) return
    if(liuUtil.isChildElementVisible(parent, el)) return
    const alignToTop = newV > oldV ? false : true
    el.scrollIntoView(alignToTop)
  })
}