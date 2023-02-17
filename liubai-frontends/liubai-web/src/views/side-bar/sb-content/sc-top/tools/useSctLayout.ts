import { ref, watch, inject } from 'vue';
import { sidebarWidthKey } from "~/utils/provide-keys"

export function useSctLayout() {
  const sidebarWidthPx = inject(sidebarWidthKey, ref(300))

  const boxWidth = ref("36px")
  const iconWidth = ref("24px")
  const showMore = ref(false)
  const toolWidth = ref("calc(96% - 12px)")

  const whenSidebarWidthChange = (newV: number) => {
    const oldShowMore = showMore.value
    if(newV < 240 && !oldShowMore) showMore.value = true
    else if(newV >= 240 && oldShowMore) showMore.value = false
  
    if(newV < 450) toolWidth.value = "calc(96% - 12px)"
    else toolWidth.value = "calc(66% - 12px)"
  
    if(newV < 320) {
      boxWidth.value = "36px"
      iconWidth.value = "24px"
    }
    else {
      boxWidth.value = "40px"
      iconWidth.value = "28px"
    }
  }
  watch(sidebarWidthPx, (newV) => {
    whenSidebarWidthChange(newV)
  })
  whenSidebarWidthChange(sidebarWidthPx.value)

  return {
    boxWidth,
    iconWidth,
    showMore,
    toolWidth,
  }
}