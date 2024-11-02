import { 
  nextTick, 
  onActivated, 
  onDeactivated, 
  provide, 
  reactive, 
  ref, 
  shallowRef, 
  toRef, 
  useTemplateRef, 
  watch,
} from "vue";
import type { SvProps, SvEmits, SvCtx, SvData } from "./types"
import type { 
  SvTriggerType,
  SvProvideInject, 
  SvBottomUp,
} from "~/types/components/types-scroll-view"
import { 
  scrollViewKey, 
  svScrollingKey, 
  svBottomUpKey,
  svElementKey,
  svPullRefreshKey,
} from "~/utils/provide-keys"
import { useDebounceFn, useResizeObserver } from "~/hooks/useVueUse"
import time from "~/utils/basic/time";
import valTool from "~/utils/basic/val-tool";
import liuApi from "~/utils/liu-api";
import { useLayoutStore } from "~/views/useLayoutStore";
import { storeToRefs } from "pinia";

const MIN_SCROLL_DURATION = 17
const MIN_INVOKE_DURATION = 300
const MAGIC_NUM_1 = 500
const MAGIC_NUM_2 = 500  // 当切换 view 视图（通常来自于路由切换）时，多少 ms 内的 onScrolling 更新自动忽略
const MAX_RUN_TIMES = 5

export function useScrollView(props: SvProps, emits: SvEmits) {
  const sv = useTemplateRef<HTMLDivElement>("sv")
  const scrollPosition = ref(0)
  const bottomUp = shallowRef<SvBottomUp>({ type: "pixel" })
  const lastToggleViewStamp = ref(time.getTime())

  provide(svElementKey, sv)
  provide(svScrollingKey, scrollPosition)
  provide(svBottomUpKey, bottomUp)

  const svData = reactive<SvData>({
    offset: 0,
  })
  
  const ctx: SvCtx = {
    props,
    emits,
    sv,
    scrollPosition,
    lastToggleViewStamp,
    isVisible: ref(true),
    svData,
  }

  const { onScrolling } = listenToScroll(ctx)
  listenToViewChange(ctx)

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
    const stamp = lastToggleViewStamp.value
    if(time.isWithinMillis(stamp, 300)) {
      return
    }
    onScrolling()
  }, 60)
  useResizeObserver(sv, _resize)


  // listen to pulling refresh
  const { 
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = listenToPullingRefresh(ctx)

  if(props.considerBottomNaviBar) {
    listenToLayout(ctx)
  }

  return { 
    sv,
    svData,
    onScrolling,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}


function listenToLayout(
  ctx: SvCtx,
) {
  const layoutStore = useLayoutStore()
  const { bottomNaviBar, bnbHeight, bnbGoToTop } = storeToRefs(layoutStore)
  watch([bottomNaviBar, bnbHeight], ([newV1, newV2]) => {
    ctx.svData.offset = !newV1 ? 0 : newV2
  }, { immediate: true })

  watch(bnbGoToTop, (newV) => {
    if(!ctx.isVisible.value || newV < 1) {
      return
    }
    whenBottomUp(ctx, { type: "pixel", pixel: 0 })
  })
}

function listenToViewChange(
  ctx: SvCtx,
) {
  const {
    props,
    sv,
    scrollPosition,
    lastToggleViewStamp,
    isVisible,
  } = ctx

  const _setScollPosition = (sp: number) => {
    const svv = sv.value
    if(!svv) return
    const isVertical = props.direction === "vertical"

    // there are two ways to set scroll position
    // 1. use scrollTo()
    // 2. use scrollTop / scrollLeft

    const sop: ScrollToOptions = { behavior: "instant" }
    if(isVertical) sop.top = sp
    else sop.left = sp
    svv.scrollTo(sop)

    // if(isVertical) svv.scrollTop = sp
    // else svv.scrollLeft = sp
  }

  const _getScrollPosition = () => {
    const svv = sv.value
    if(!svv) return
    return svv.scrollTop
  }

  const _restorePosition = async () => {
    const sp = scrollPosition.value
    // console.log("期望 sp: ", sp)
    if(!sp) return
    
    // 由于 v-show 的切换需要时间渲染到界面上
    // 所以加一层 nextTick 等待页面渲染完毕再恢复至上一次的位置
    // console.time("nextTick1")
    await nextTick()
    // console.timeEnd("nextTick1")    
    _setScollPosition(sp)
    // console.log("实际 sp1: ", _getScrollPosition())

    let runTimes = 0
    while(runTimes < MAX_RUN_TIMES) {
      runTimes++
      // console.time("requestAnimationFrame")
      await liuApi.requestAnimationFrame()
      // console.timeEnd("requestAnimationFrame")

      _setScollPosition(sp)
      const sp2 = _getScrollPosition()
      // console.log("实际 sp2: ", sp2)

      if(typeof sp2 === "undefined") break
      const diff = Math.abs(sp2 - sp)
      if(diff < 11) {
        scrollPosition.value = sp2
        break
      }
    }
  }

  let isActivated = ref(false)
  onActivated(() => {
    lastToggleViewStamp.value = time.getTime()
    isActivated.value = true
  })

  onDeactivated(() => {
    lastToggleViewStamp.value = time.getTime()
    isActivated.value = false
  })

  watch(isVisible, (newV, oldV) => {
    if(newV) {
      _restorePosition()
    }
  })

  const showTxtRef = toRef(props, "showTxt")
  watch([isActivated, showTxtRef], ([newV1, newV2]) => {
    const isShow = Boolean(newV2 !== "F")
    const newVisible = Boolean(newV1 && isShow)
    isVisible.value = newVisible
  })

}

function listenToScroll(
  ctx: SvCtx,
) {
  const {
    props,
    emits,
    sv,
    scrollPosition,
    isVisible,
    svData,
  } = ctx

  const proData = reactive<SvProvideInject>({
    type: "",
    triggerNum: 0,
  })
  provide(scrollViewKey, proData)

  let lastScrollSize = 0
  let lastScrollPosition = 0
  let lastScrollStamp = 0
  let lastInvokeStamp = 0

  const _setSvData = (
    svType: SvTriggerType,
    sP: number,
    sH: number,
  ) => {
    if(svType === "to_end") {
      emits("scrolltoend", { scrollPosition: sP })
    }
    else {
      emits("scrolltostart", { scrollPosition: sP })
    }
    proData.type = svType
    proData.triggerNum++
    lastInvokeStamp = time.getLocalTime()
    lastScrollSize = sH
    lastScrollPosition = sP
  }

  const _specialToEnd = async (
    sP: number,
    sH: number,
  ) => {
    await valTool.waitMilli(MAGIC_NUM_1)
    if(time.isWithinMillis(lastInvokeStamp, MAGIC_NUM_1, true)) {
      return
    }
    emits("scrolltoend", { scrollPosition: sP })
    proData.type = "to_end"
    proData.triggerNum++
    lastInvokeStamp = time.getLocalTime()
    lastScrollSize = sH
    lastScrollPosition = sP
  }

  const onScrolling = () => {
    const _sv = sv.value
    if(!_sv) return

    const isVertical = props.direction === "vertical"
    const sP = isVertical ? _sv.scrollTop : _sv.scrollLeft
    const lP = lastScrollPosition

    const lastViewStamp = ctx.lastToggleViewStamp.value
    if(time.isWithinMillis(lastViewStamp, MAGIC_NUM_2)) {
      return
    }

    if(!isVisible.value) {
      return
    }

    // 防抖截流，避免频繁触发 onScrolling
    if(time.isWithinMillis(lastScrollStamp, MIN_SCROLL_DURATION, true)) {
      if(sP !== 0 && lP !== 0) return
    }
    lastScrollStamp = time.getLocalTime()
  

    const cH = isVertical ? _sv.clientHeight : _sv.clientWidth
    const sH0 = isVertical ? _sv.scrollHeight : _sv.scrollWidth
    const sH = sH0 - cH
    const lH = lastScrollSize

    scrollPosition.value = sP
    emits("scroll", { scrollPosition: sP })

    // console.log("onScrolling sP: ", sP)
    // console.log("lP: ", lP)
    // console.log("sH: ", sH)
    // console.log("lH: ", lH)
    // console.log(" ")
  
    const DIRECTION = sP - lP > 0 ? "DOWN" : "UP"
    const _lowerThreshold = props.lowerThreshold + svData.offset
    const _upperThreshold = props.upperThreshold
    const middleLine = DIRECTION === "DOWN" ? sH - _lowerThreshold : _upperThreshold

    // fix: bug when user navigate back to the last page
    if(time.isWithinMillis(lastViewStamp, MAGIC_NUM_1)) {
      const doubleThreshold = _lowerThreshold * 2
      if(sH >= doubleThreshold) {
        const doubleDuration = MIN_INVOKE_DURATION * 2
        if(!time.isWithinMillis(lastInvokeStamp, doubleDuration, true)) {
          const lowerLine = sH - _lowerThreshold
          if(lowerLine <= lP && lowerLine <= sP) {
            // console.warn("to_end 111")
            _specialToEnd(sP, sH)
            return
          }
        }
      }
    }


    if(DIRECTION === "DOWN") {
      if(lP < middleLine && middleLine <= sP) {
        if(!time.isWithinMillis(lastInvokeStamp, MIN_INVOKE_DURATION, true)) {
          // console.warn("to_end 222")
          _setSvData("to_end", sP, sH)
          return
        }
      }

      // lastScrollSize is much bigger than the latest one,
      // and lastScrollPosition is bigger than the current middleLine
      // which means some items may be removed from the scroll-view
      // so we need to trigger the `to_end` event
      if(sH < (lH - 100) && lP > middleLine) {
        if(!time.isWithinMillis(lastInvokeStamp, MIN_INVOKE_DURATION, true)) {
          console.warn("to_end 333")
          _setSvData("to_end", sP, sH)
          return
        }
      }

    }
    else if(DIRECTION === "UP") {
      if(lP > middleLine && middleLine >= sP) {
        if(!time.isWithinMillis(lastInvokeStamp, MIN_INVOKE_DURATION, true)) {
          _setSvData("to_start", sP, sH)
          return
        }
      }
    }
  
    lastScrollSize = sH
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
  const svv = sv.value
  if(!svv) return
  
  const isVertical = props.direction === "vertical"
  const sop: ScrollToOptions = {
    behavior: bu.instant ? "instant" : "smooth"
  }

  // 如果是 number 类型，直接滚动到特定位置
  if(bu.type === "pixel" && typeof bu.pixel !== "undefined") {
    if(isVertical) sop.top = bu.pixel
    else sop.left = bu.pixel
    svv.scrollTo(sop)

    if(bu.instant) {
      ctx.scrollPosition.value = bu.pixel
    }

    return
  }

  // 如果是 string 类型，代表要传递到 .querySelector()
  if(bu.type !== "selectors" || typeof bu.selectors !== "string") return
  const el = svv.querySelector(bu.selectors)
  if(!el) return

  const scrollPosition = isVertical ? svv.scrollTop : svv.scrollLeft

  const domRect = el.getBoundingClientRect()
  const { top, left } = domRect
  let diff = isVertical ? top : left
  if(bu.initPixel) diff = diff - bu.initPixel

  let sP = scrollPosition + diff
  if(bu.offset) sP += bu.offset
  if(sP < 0) sP = 0

  if(isVertical) sop.top = sP
  else sop.left = sP

  svv.scrollTo(sop)
}

