import { ref, watch, inject } from 'vue';
import { sidebarWidthKey } from "~/utils/provide-keys"
import type { ScTopProps } from "./types"
import { useWindowSize } from "~/hooks/useVueUse"

export function useSctLayout(props: ScTopProps) {
  const sidebarWidthPx = inject(sidebarWidthKey, ref(300))
  const { width: windowWidth } = useWindowSize()

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

  const whenWindowWidthChange = (newV: number) => {
    const oldShowMore = showMore.value

    if(newV < 300 && !oldShowMore) showMore.value = true
    else if(newV >= 300 && oldShowMore) showMore.value = false
  
    if(newV < 450) toolWidth.value = "calc(96% - 12px)"
    else toolWidth.value = "calc(66% - 12px)"

    if(newV >= 450) {
      boxWidth.value = "40px"
      iconWidth.value = "28px"
    }
    else if(newV >= 400) {
      boxWidth.value = "70px"
      iconWidth.value = "28px"
    }
    else if(newV >= 370) {
      boxWidth.value = "60px"
      iconWidth.value = "28px"
    }
    else if(newV >= 330) {
      boxWidth.value = "50px"
      iconWidth.value = "26px"
    }
    else if(newV >= 300) {
      boxWidth.value = "40px"
      iconWidth.value = "26px"
    }
    else {
      boxWidth.value = "56px"
      iconWidth.value = "26px"
    }
  }


  if(props.isFixed) {
    // 如果是 fixed 布局，监听 window width 变化
    watch(windowWidth, (newV) => {
      whenWindowWidthChange(newV)
    }, { immediate: true })
  }
  else {
    // 反之，监听 sidebarWidthPx 变化
    watch(sidebarWidthPx, (newV) => {
      whenSidebarWidthChange(newV)
    }, { immediate: true })
  }


  return {
    boxWidth,
    iconWidth,
    showMore,
    toolWidth,
  }
}