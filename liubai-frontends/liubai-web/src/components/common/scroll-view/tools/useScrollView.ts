import { onActivated, ref } from "vue";
import type { SvProps, SvEmits } from "./types"

const MIN_SCROLL_DURATION = 17
const MIN_INVOKE_DURATION = 300

export function useScrollView(props: SvProps, emits: SvEmits) {
  const sv = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)

  let lastScrollTop = 0
  let lastScrollStamp = 0
  let lastInvokeStamp = 0

  const onScrolling = (e: Event) => {
    if(!sv.value) return

    const sT = sv.value.scrollTop

    const now = Date.now()
    if(lastScrollStamp + MIN_SCROLL_DURATION > now) {
      // 确保在零点时 不会受防抖节流影响
      if(sT !== 0 || scrollTop.value === 0) return
    }
    lastScrollStamp = now
  
    
    const cH = sv.value.clientHeight
    const sH = sv.value.scrollHeight - cH

    scrollTop.value = sT
    emits("scroll", { scrollTop: sT })
  
    const DIRECTION = sT - lastScrollTop > 0 ? "DOWN" : "UP"
    const middleLine = DIRECTION === "DOWN" ? sH - props.lowerThreshold : props.upperThreshold
    
    if(DIRECTION === "DOWN") {
      if(lastScrollTop < middleLine && middleLine <= sT) {
        if(lastInvokeStamp + MIN_INVOKE_DURATION < now) {
          emits("scrolltolower", { scrollTop: sT })
          lastInvokeStamp = now
        }
      }
    }
    else if(DIRECTION === "UP") {
      if(lastScrollTop > middleLine && middleLine >= sT) {
        if(lastInvokeStamp + MIN_INVOKE_DURATION < now) {
          emits("scrolltoupper", { scrollTop: sT })
          lastInvokeStamp = now
        }
      }
    }
  
    lastScrollTop = sT
  }

  onActivated(() => {
    if(!sv.value || !scrollTop.value) return
    sv.value.scrollTop = scrollTop.value
  })

  return { sv, scrollTop, onScrolling }
}

