import { computed, provide, reactive, shallowRef, useTemplateRef } from "vue";
import type { CsCtx, CsData, CsEmits, CsProps } from "./types";
import time from "~/utils/basic/time";
import {
  svScrollingKey, 
  svBottomUpKey,
  scrollViewKey,
} from "~/utils/provide-keys"
import type { SvBottomUp, SvProvideInject, SvTriggerType } from "~/types/components/types-scroll-view";
import cfg from "~/config";

const MIN_SCROLL_DURATION = 17
const MIN_INVOKE_DURATION = 300
const MAGIC_NUM_1 = 500
const MAGIC_NUM_2 = 500  // 当切换 view 视图（通常来自于路由切换）时，多少 ms 内的 onScrolling 更新自动忽略
const MAX_RUN_TIMES = 5
const THRESHOLD = 150

export function useChatScroll(
  props: CsProps,
  emits: CsEmits,
) {
  // 1. init data
  const cs = useTemplateRef<HTMLDivElement>("cs")
  const csData = reactive<CsData>({
    scrollPosition: 0,
    lastToggleViewStamp: time.getLocalTime(),
    isVisible: true,
    offset: cfg.navi_height,
  })
  const ctx: CsCtx = {
    props,
    emits,
    cs,
    csData,
  }


  // 2. listen to scroll
  const { onScrolling } = listenToScroll(ctx)


  // 3. provide some data
  const sP = computed(() => csData.scrollPosition)
  const bottomUp = shallowRef<SvBottomUp>({ type: "pixel" })
  provide(svScrollingKey, sP)
  provide(svBottomUpKey, bottomUp)


  return {
    cs,
    csData,
    onScrolling,
  }
}


function listenToScroll(
  ctx: CsCtx,
) {
  const { props, emits, csData, cs } = ctx

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


  const onScrolling = () => {
    const _cs = cs.value
    if(!_cs) return

    // [important] sP is zero to negative!
    const sP = _cs.scrollTop
    const lP = lastScrollPosition

    // 1. return if view is just switched
    const lastViewStamp = csData.lastToggleViewStamp
    if(time.isWithinMillis(lastViewStamp, MAGIC_NUM_2)) {
      if(!sP) {
        return
      }
    }

    // 2. return if view is not visible
    if(!csData.isVisible) return

    // 3. return if scroll is too frequent
    // 防抖截流，避免频繁触发 onScrolling
    if(time.isWithinMillis(lastScrollStamp, MIN_SCROLL_DURATION, true)) {
      if(sP !== 0 && lP !== 0) return
    }
    lastScrollStamp = time.getLocalTime()

    const cH0 = _cs.clientHeight
    const sH0 = _cs.scrollHeight
    const sH = -(sH0 - cH0)

    const DIRECTION = (sP - lP) < 0 ? "UP" : "DOWN"
    const endThreshold = THRESHOLD + csData.offset
    const startThreshold = THRESHOLD

    if(DIRECTION === "UP") {
      const endLine = sH + endThreshold
      if(lP > endLine && sP <= endLine) {
        if(!time.isWithinMillis(lastInvokeStamp, MIN_INVOKE_DURATION, true)) {
          console.log("to_end......")
          _setSvData("to_end", sP, sH)
          return
        }
      }
    }
    else {
      const startLine = -startThreshold
      if(lP < startLine && sP >= startLine) {
        if(!time.isWithinMillis(lastInvokeStamp, MIN_INVOKE_DURATION, true)) {
          console.log("to_start......")
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