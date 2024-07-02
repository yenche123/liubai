import { 
  nextTick, 
  onActivated, 
  onDeactivated, 
  provide, 
  reactive, 
  ref, 
  shallowRef, 
  toRef, 
  watch,
} from "vue";
import type { SvProps, SvEmits, SvCtx } from "./types"
import type { SvProvideInject, SvBottomUp } from "~/types/components/types-scroll-view"
import { 
  scrollViewKey, 
  svScollingKey, 
  svBottomUpKey,
  svElementKey,
  svPullRefreshKey,
} from "~/utils/provide-keys"
import { useDebounceFn, useResizeObserver } from "~/hooks/useVueUse"
import time from "~/utils/basic/time";

const MIN_SCROLL_DURATION = 17
const MIN_INVOKE_DURATION = 300

export function useScrollView(props: SvProps, emits: SvEmits) {
  const sv = ref<HTMLElement | null>(null)
  const scrollPosition = ref(0)
  const bottomUp = shallowRef<SvBottomUp>({ type: "pixel" })

  provide(svElementKey, sv)
  provide(svScollingKey, scrollPosition)
  provide(svBottomUpKey, bottomUp)
  
  const ctx: SvCtx = {
    props,
    emits,
    sv,
    scrollPosition,
  }

  const { onScrolling } = listenToScroll(ctx)

  const _setScollPosition = (sp: number) => {
    const svv = sv.value
    if(!svv) return
    const isVertical = props.direction === "vertical"
    if(isVertical) svv.scrollTop = sp
    else svv.scrollLeft = sp
  }

  let lastToggleViewStamp = time.getTime()
  onActivated(async () => {
    lastToggleViewStamp = time.getTime()
    if(props.showTxt === "false") {
      return
    }

    const sp = scrollPosition.value
    if(!sp) return
    _setScollPosition(sp)

    // 由于 v-show 的切换需要时间渲染到界面上
    // 所以加一层 nextTick 等待页面渲染完毕再恢复至上一次的位置
    await nextTick()
    _setScollPosition(sp)
  })

  onDeactivated(() => {
    lastToggleViewStamp = time.getTime()
  })

  watch(bottomUp, (newV) => {
    whenBottomUp(ctx, newV)
  })

  const goToTop = toRef(props, "goToTop")
  watch(goToTop, (newV) => {
    if(newV > 0) {
      whenBottomUp(ctx, { type: "pixel", pixel: 0 })
    }
  })

  // listen to sv width changed
  const _resize = useDebounceFn((entries) => {
    if(time.isWithinMillis(lastToggleViewStamp, 300)) return
    onScrolling()
  }, 60)
  useResizeObserver(sv, _resize)


  // listen to pulling refresh
  const { 
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = listenToPullingRefresh(ctx)

  return { 
    sv,
    onScrolling,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}

function listenToScroll(
  ctx: SvCtx,
) {
  const {
    props,
    emits,
    sv,
    scrollPosition,
  } = ctx

  const proData = reactive<SvProvideInject>({
    type: "",
    triggerNum: 0,
  })
  provide(scrollViewKey, proData)

  let lastScrollPosition = 0
  let lastScrollStamp = 0
  let lastInvokeStamp = 0

  const onScrolling = () => {
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
        if(!time.isWithinMillis(lastInvokeStamp, MIN_INVOKE_DURATION)) {
          emits("scrolltoend", { scrollPosition: sP })
          proData.type = "to_end"
          proData.triggerNum++
          lastInvokeStamp = now
        }
      }
    }
    else if(DIRECTION === "UP") {
      if(lastScrollPosition > middleLine && middleLine >= sP) {
        if(!time.isWithinMillis(lastInvokeStamp, MIN_INVOKE_DURATION)) {
          emits("scrolltostart", { scrollPosition: sP })
          proData.type = "to_start"
          proData.triggerNum++
          lastInvokeStamp = now
        }
      }
    }
  
    lastScrollPosition = sP
  }

  return {
    onScrolling,
  }
}


function listenToPullingRefresh(
  ctx: SvCtx,
) {
  const { props, sv, scrollPosition, emits } = ctx
  if(props.direction === "horizontal") {
    return {
      onTouchStart: () => {},
      onTouchEnd: () => {},
    }
  }

  const pullRefreshNum = ref(0)
  provide(svPullRefreshKey, pullRefreshNum)

  let isPullingRefresh = false
  let lastStartToPullStamp = 0
  let initClientY = 0
  let lastClientY = 0
  const onTouchStart = (e: TouchEvent) => {
    const svEl = sv.value
    if(!svEl) return

    const sP = scrollPosition.value
    // console.log("sP: ", sP)

    if(sP > 10) return
    const boxRect = svEl.getBoundingClientRect()
    const touches = e.targetTouches
    const firstTouch = touches[0]
    if(!firstTouch) return

    const touchY = firstTouch.clientY
    const boxHeight = boxRect.height
    const threshold = boxHeight * 0.8

    if(touchY > threshold) {
      // console.log("触摸的位置太 ⬇️ 方了........")
      return
    }

    initClientY = touchY
    lastClientY = initClientY

    // console.log("start...........")
    // console.log(" ")

    isPullingRefresh = true
    lastStartToPullStamp = time.getTime()
  }

  const onTouchMove = (e: TouchEvent) => {
    if(!isPullingRefresh) return
    const touches = e.targetTouches
    const firstTouch = touches[0]
    if(!firstTouch) return
    lastClientY = firstTouch.clientY
  }

  const _reset = () => {
    initClientY = 0
    lastClientY = 0
    isPullingRefresh = false
    lastStartToPullStamp = 0
  }

  const onTouchEnd = () => {
    if(!isPullingRefresh) return

    const stamp = lastStartToPullStamp
    const now = time.getTime()
    const duration = now - stamp
    const diffPx = lastClientY - initClientY
    // console.log("触摸时间差: ", duration)
    // console.log("触摸位置差: ", diffPx)
    // console.log(" ")

    if(duration < 200 || duration > 4000) {
      _reset()
      return
    }

    if(diffPx < 100 || diffPx > 800) {
      _reset()
      return
    }

    console.warn("去触发下拉刷新")
    
    emits("refresh")
    pullRefreshNum.value++
    _reset()
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}

function whenBottomUp(
  ctx: SvCtx,
  bu: SvBottomUp,
) {
  const { props, sv } = ctx
  if(!sv.value) return
  
  const isVertical = props.direction === "vertical"
  const sop: ScrollToOptions = {
    behavior: bu.instant ? "instant" : "smooth"
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
  if(bu.offset) sP += bu.offset
  if(sP < 0) sP = 0

  if(isVertical) sop.top = sP
  else sop.left = sP

  sv.value.scrollTo(sop)
}

