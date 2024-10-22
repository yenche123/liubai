import { inject, reactive, toRef, watch } from "vue";
import type { Ref } from "vue";
import { useLayoutStore } from "~/views/useLayoutStore";
import type { LayoutStore } from "~/views/useLayoutStore";
import { storeToRefs } from "pinia";
import { useWindowSize } from "~/hooks/useVueUse";
import cfg from "~/config";
import type { NaviAutoEmits, NaviAutoData, NaviAutoProps } from "./types"
import liuUtil from "~/utils/liu-util";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import time from "~/utils/basic/time";
import { deviceChaKey } from "~/utils/provide-keys";

const TRANSITION_DURATION = 300

let lastScrollPosition = 0
let lastOpenStamp = 0

interface NaviAutoCtx {
  naData: NaviAutoData
  scrollPosition: Ref<number>
  layout: LayoutStore
  windowWidth: Ref<number>
  emits: NaviAutoEmits
}

export function useNaviAuto(
  props: NaviAutoProps,
  emits: NaviAutoEmits,
) {
  const naData = reactive<NaviAutoData>({
    enable: false,
    show: false,
    shadow: false,
    tempHidden: false,
  })

  // 引入上下文
  const layout = useLayoutStore()
  const scrollPosition = toRef(props, "scrollPosition")

  // 窗口宽度
  const { width: windowWidth } = useWindowSize()

  const ctx: NaviAutoCtx = {
    naData,
    scrollPosition,
    layout,
    windowWidth,
    emits,
  }


  const cha = inject(deviceChaKey)
  if(!cha?.isInWebView || !cha?.isMobile) {
    initListenContext(ctx)
  }
  
  return {
    TRANSITION_DURATION,
    naData,
  }
}

function initListenContext(ctx: NaviAutoCtx) {
  const { layout, scrollPosition, naData } = ctx
  const { sidebarWidth, sidebarStatus } = storeToRefs(layout)

  // 处理 左侧边栏的变化
  watch([sidebarWidth, sidebarStatus], (newV) => {
    judgeState(ctx)
  }, { immediate: true })

  // 监听滚动，处理是否要显示阴影
  watch(scrollPosition, (newV) => {
    if(!naData.enable) return
    judgeScrollPosition(ctx)
    judgeShadow(ctx)
  })

  // 监听窗口变化
  listenWindowChange(ctx)
}


function judgeScrollPosition(
  ctx: NaviAutoCtx,
) {
  const { scrollPosition, naData } = ctx
  const sP = scrollPosition.value
  const justOpened = time.isWithinMillis(lastOpenStamp, 1000)

  if(sP < 200 || justOpened) {
    if(naData.tempHidden) {
      naData.tempHidden = false
    }
    lastScrollPosition = sP
    return
  }

  const diff1 = Math.abs(sP - lastScrollPosition)
  if(diff1 < 10) return

  const diff2 = sP - lastScrollPosition
  if(diff2 >= 0 && !naData.tempHidden) {
    naData.tempHidden = true
  }
  else if(diff2 < 0 && naData.tempHidden) {
    naData.tempHidden = false
  }

  lastScrollPosition = sP
}

function judgeShadow(
  ctx: NaviAutoCtx,
) {
  const oldV = ctx.naData.shadow
  const sT = ctx.scrollPosition.value
  let newV = oldV
  if(sT >= 40 && !oldV) newV = true
  else if(sT <= 20 && oldV) newV = false
  ctx.naData.shadow = newV
}


// 聆听 左侧边栏的变化
let firstLoadStamp = 0
function judgeState(
  ctx: NaviAutoCtx,
) {
  const { windowWidth } = ctx
  const winWidthPx = windowWidth.value

  if(!firstLoadStamp) {
    firstLoadStamp = time.getTime()
  }

  const { sidebarWidth, sidebarStatus } = ctx.layout
  if(sidebarWidth > 0 || sidebarStatus === "fullscreen") {
    _close(ctx)
  }
  else if(winWidthPx >= cfg.breakpoint_max_size.mobile) {
    _close(ctx)
  }
  else {
    const justLoad = time.isWithinMillis(firstLoadStamp, 2000)
    if(justLoad) _openInstantly(ctx)
    else _open(ctx)
  }

  // 判断阴影变化
  judgeShadow(ctx)
}

// 聆听窗口变化
function listenWindowChange(
  ctx: NaviAutoCtx,
) {

  const whenWindowChange = (winWidthPx: number) => {
    const { sidebarWidth, sidebarStatus } = ctx.layout
    if(sidebarWidth > 0 || sidebarStatus === "fullscreen") return

    const { enable, show } = ctx.naData
    const {
      isOpening,
      isClosing,
    } = liuUtil.view.getOpeningClosing(enable, show)

    if(winWidthPx <= cfg.breakpoint_max_size.mobile && !isOpening) {
      _open(ctx)
    }
    else if(winWidthPx > cfg.breakpoint_max_size.mobile && !isClosing) {
      _close(ctx)
    }
  }

  watch(ctx.windowWidth, (newV) => {
    whenWindowChange(newV)
  })
}

let toggleTimeout: LiuTimeout
function _reset(ctx: NaviAutoCtx) {
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  ctx.naData.tempHidden = false
  lastOpenStamp = time.getTime()
  lastScrollPosition = ctx.scrollPosition.value
}

function _openInstantly(
  ctx: NaviAutoCtx,
) {
  const { naData } = ctx
  _reset(ctx)
  naData.enable = true
  naData.show = true
  ctx.emits("naviautochanged", true)
}

async function _open(
  ctx: NaviAutoCtx,
) {
  const { naData } = ctx
  if(naData.show) return
  _reset(ctx)
  naData.enable = true
  ctx.emits("naviautochanged", true)
  toggleTimeout = setTimeout(() => {
    naData.show = true
  }, cfg.frame_duration)
}

async function _close(
  ctx: NaviAutoCtx,
) {
  const { naData } = ctx
  if(!naData.enable) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  naData.show = false
  ctx.emits("naviautochanged", false)
  toggleTimeout = setTimeout(() => {
    naData.enable = false
  }, TRANSITION_DURATION)
}


