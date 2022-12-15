import { onActivated, provide, reactive, ref, ShallowRef, shallowRef, watch } from "vue";
import type { SvProps, SvEmits, SvProvideInject, SvBottomUp } from "./types"
import { scrollViewKey, svScollingKey, svBottomUpKey } from "../../../../utils/provide-keys"
import type { Ref } from "vue";
import cfg from "../../../../config";

const MIN_SCROLL_DURATION = 17
const MIN_INVOKE_DURATION = 300

export function useScrollView(props: SvProps, emits: SvEmits) {
  const sv = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)

  const proData = reactive<SvProvideInject>({
    type: "",
    triggerNum: 0,
  })

  const bottomUp = shallowRef<SvBottomUp>({ type: "pixel" })

  provide(scrollViewKey, proData)
  provide(svScollingKey, scrollTop)
  provide(svBottomUpKey, bottomUp)

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
    console.log("onScrolling.........")
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
          proData.type = "to_lower"
          proData.triggerNum++
          lastInvokeStamp = now
        }
      }
    }
    else if(DIRECTION === "UP") {
      if(lastScrollTop > middleLine && middleLine >= sT) {
        if(lastInvokeStamp + MIN_INVOKE_DURATION < now) {
          emits("scrolltoupper", { scrollTop: sT })
          proData.type = "to_upper"
          proData.triggerNum++
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

  watch(bottomUp, (newV) => {
    whenBottomUp(sv, newV)
  })

  return { sv, scrollTop, onScrolling }
}

function whenBottomUp(
  sv: Ref<HTMLElement | null>,
  bu: SvBottomUp,
) {
  if(!sv.value) return

  // 如果是 number 类型，直接滚动到特定位置
  if(bu.type === "pixel" && typeof bu.pixel !== "undefined") {
    sv.value.scrollTo({ top: bu.pixel, behavior: "smooth" })
    return
  }

  // 如果是 string 类型，代表要传递到 .querySelector()
  if(bu.type !== "selectors" || typeof bu.selectors !== "string") return
  const el = sv.value.querySelector(bu.selectors)
  if(!el) return

  const scrollTop = sv.value.scrollTop

  const domRect = el.getBoundingClientRect()
  console.log("domRect: ", domRect)
  const { top } = domRect
  const diff = top - cfg.navi_height
  
  console.log("diff: ", diff)

  const sT = scrollTop + diff

  console.log("sT: ", sT)
  console.log(" ")

  sv.value.scrollTo({ top: sT, behavior: "smooth" })
}

