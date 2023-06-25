import { onActivated, provide, reactive, ref, shallowRef, toRef, watch } from "vue";
import type { SvProps, SvEmits } from "./types"
import type { SvProvideInject, SvBottomUp } from "~/types/components/types-scroll-view"
import { scrollViewKey, svScollingKey, svBottomUpKey } from "~/utils/provide-keys"
import type { Ref } from "vue";

const MIN_SCROLL_DURATION = 17
const MIN_INVOKE_DURATION = 300

export function useScrollView(props: SvProps, emits: SvEmits) {
  const sv = ref<HTMLElement | null>(null)
  const scrollPosition = ref(0)

  const proData = reactive<SvProvideInject>({
    type: "",
    triggerNum: 0,
  })

  const bottomUp = shallowRef<SvBottomUp>({ type: "pixel" })

  provide(scrollViewKey, proData)
  provide(svScollingKey, scrollPosition)
  provide(svBottomUpKey, bottomUp)

  let lastScrollPosition = 0
  let lastScrollStamp = 0
  let lastInvokeStamp = 0

  const onScrolling = (e: Event) => {
    const _sv = sv.value
    if(!_sv) return

    const isVertical = props.direction === "vertical"
    const sP = isVertical ? _sv.scrollTop : _sv.scrollLeft

    const now = Date.now()
    if(lastScrollStamp + MIN_SCROLL_DURATION > now) {
      // 确保在零点时 不会受防抖节流影响
      if(sP !== 0 || scrollPosition.value === 0) return
    }
    lastScrollStamp = now
  
    
    const cH = isVertical ? _sv.clientHeight : _sv.clientWidth
    const sH0 = isVertical ? _sv.scrollHeight : _sv.scrollWidth
    const sH = sH0 - cH

    scrollPosition.value = sP
    emits("scroll", { scrollPosition: sP })
  
    const DIRECTION = sP - lastScrollPosition > 0 ? "DOWN" : "UP"
    const middleLine = DIRECTION === "DOWN" ? sH - props.lowerThreshold : props.upperThreshold
    
    if(DIRECTION === "DOWN") {
      if(lastScrollPosition < middleLine && middleLine <= sP) {
        if(lastInvokeStamp + MIN_INVOKE_DURATION < now) {
          emits("scrolltoend", { scrollPosition: sP })
          proData.type = "to_end"
          proData.triggerNum++
          lastInvokeStamp = now
        }
      }
    }
    else if(DIRECTION === "UP") {
      if(lastScrollPosition > middleLine && middleLine >= sP) {
        if(lastInvokeStamp + MIN_INVOKE_DURATION < now) {
          emits("scrolltostart", { scrollPosition: sP })
          proData.type = "to_start"
          proData.triggerNum++
          lastInvokeStamp = now
        }
      }
    }
  
    lastScrollPosition = sP
  }

  onActivated(() => {
    const sp = scrollPosition.value
    if(!sv.value || !sp) return
    const isVertical = props.direction === "vertical"
    if(isVertical) sv.value.scrollTop = sp
    else sv.value.scrollLeft = sp
  })

  watch(bottomUp, (newV) => {
    whenBottomUp(sv, newV, props)
  })

  const goToTop = toRef(props, "goToTop")
  watch(goToTop, (newV) => {
    if(newV > 0) {
      whenBottomUp(sv, { type: "pixel", pixel: 0 }, props)
    }
  })

  return { sv, scrollPosition, onScrolling }
}

function whenBottomUp(
  sv: Ref<HTMLElement | null>,
  bu: SvBottomUp,
  props: SvProps,
) {
  if(!sv.value) return
  
  const isVertical = props.direction === "vertical"
  const sop: ScrollToOptions = {
    behavior: "smooth" 
  }

  // 如果是 number 类型，直接滚动到特定位置
  if(bu.type === "pixel" && typeof bu.pixel !== "undefined") {
    if(isVertical) sop.top = bu.pixel
    else sop.left = bu.pixel
    sv.value.scrollTo(sop)
    return
  }

  // 如果是 string 类型，代表要传递到 .querySelector()
  if(bu.type !== "selectors" || typeof bu.selectors !== "string") return
  const el = sv.value.querySelector(bu.selectors)
  if(!el) return

  const scrollPosition = isVertical ? sv.value.scrollTop : sv.value.scrollLeft

  const domRect = el.getBoundingClientRect()
  const { top, left } = domRect
  let diff = isVertical ? top : left
  if(bu.initPixel) diff = diff - bu.initPixel

  let sP = scrollPosition + diff
  if(sP < 0) sP = 0

  if(isVertical) sop.top = sP
  else sop.left = sP

  sv.value.scrollTo(sop)
}

