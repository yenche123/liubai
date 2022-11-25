import { nextTick, toRef, watch } from "vue";
import { TagItem } from "../../tools/types";

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
    if(isContain(el)) return
    let alignToTop = newV > oldV ? false : true
    el.scrollIntoView(alignToTop)
  })
}

function isContain(child: Element) {
  const box = document.querySelector(".ht-list")
  if(!box) return true
  const boxInfo = box.getBoundingClientRect()
  const childInfo = child.getBoundingClientRect()
  const minY = boxInfo.y
  const maxY = minY + boxInfo.height
  const top = childInfo.top
  const top2 = top + childInfo.height
  // console.log("minY: ", minY)
  // console.log("maxY: ", maxY)
  // console.log("y: ", top)
  // console.log(" ")
  if(top < (minY - 1) || top >= (maxY - 5)) return false
  if(top2 >= (maxY + 10)) return false
  return true
}