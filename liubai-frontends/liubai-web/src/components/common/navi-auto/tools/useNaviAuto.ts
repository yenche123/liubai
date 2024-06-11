import { inject, reactive, ref, watch } from "vue";
import type { Ref } from "vue";
import { useLayoutStore } from "~/views/useLayoutStore";
import type { LayoutStore } from "~/views/useLayoutStore";
import { storeToRefs } from "pinia";
import valTool from "~/utils/basic/val-tool";
import { svScollingKey, svBottomUpKey } from "~/utils/provide-keys";
import sideBar from "~/views/side-bar";
import { useWindowSize } from "~/hooks/useVueUse";
import cfg from "~/config";
import type { NaviAutoEmits, NaviAutoData } from "./types"
import liuUtil from "~/utils/liu-util";
import { useBackdropFilter } from "~/hooks/useCommon";

const TRANSITION_DURATION = 300

interface NaviAutoCtx {
  naData: NaviAutoData
  scrollPosition: Ref<number>
  layout: LayoutStore,
  windowWidth: Ref<number>,
  emits: NaviAutoEmits,
}

export function useNaviAuto(
  emits: NaviAutoEmits,
) {
  const containerEl = ref<HTMLDivElement>()
  const naData = reactive<NaviAutoData>({
    enable: false,
    show: false,
    shadow: false,
    backdropFilterAgain: false,
  })
  useBackdropFilter(containerEl, naData)

  // 引入上下文
  const layout = useLayoutStore()
  const scrollPosition = inject(svScollingKey, ref(0))

  // 窗口宽度
  const { width: windowWidth } = useWindowSize()

  const ctx: NaviAutoCtx = {
    naData,
    scrollPosition,
    layout,
    windowWidth,
    emits,
  }


  // 处理 左侧边栏的变化
  const { sidebarWidth, sidebarStatus } = storeToRefs(layout)
  watch([sidebarWidth, sidebarStatus], (newV) => {
    judgeState(ctx)
  }, { immediate: true })

  // 监听滚动，处理是否要显示阴影
  watch(scrollPosition, (newV) => {
    if(!naData.enable) return
    judgeShadow(newV, ctx)
  })

  // 监听窗口变化
  listenWindowChange(ctx)
  

  const onTapMenu = () => {
    sideBar.showFixedSideBar()
  }

  const svBottomUp = inject(svBottomUpKey)
  const onTapTitle = () => {
    if(!svBottomUp) return
    // svBottomUp.value = { type: "selectors", selectors: ".mc-spacing" }
    svBottomUp.value = { type: "pixel", pixel: 0 }
  }
  
  return {
    TRANSITION_DURATION,
    containerEl,
    naData,
    onTapMenu,
    onTapTitle,
  }
}

function judgeShadow(
  sT: number,
  ctx: NaviAutoCtx,
) {
  const oldV = ctx.naData.shadow
  let newV = oldV
  if(sT >= 40 && !oldV) newV = true
  else if(sT <= 20 && oldV) newV = false
  ctx.naData.shadow = newV
}


// 聆听 左侧边栏的变化
let justLoad = true
function judgeState(
  ctx: NaviAutoCtx,
) {
  const { windowWidth } = ctx
  const winWidthPx = windowWidth.value

  const { sidebarWidth, sidebarStatus } = ctx.layout
  if(sidebarWidth > 0 || sidebarStatus === "fullscreen") {
    _close(ctx)
  }
  else if(winWidthPx >= cfg.sidebar_close_point) {
    _close(ctx)
  }
  else {
    if(justLoad) _openInstantly(ctx)
    else _open(ctx)
  }

  justLoad = false

  // 判断阴影变化
  judgeShadow(ctx.scrollPosition.value, ctx)
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

    if(winWidthPx < cfg.sidebar_close_point && !isOpening) {
      _open(ctx)
    }
    else if(winWidthPx >= cfg.sidebar_open_point && !isClosing) {
      _close(ctx)
    }
  }

  watch(ctx.windowWidth, (newV) => {
    whenWindowChange(newV)
  })
}

function _openInstantly(
  ctx: NaviAutoCtx,
) {
  const { naData } = ctx
  naData.enable = true
  naData.show = true
  ctx.emits("naviautochangeed", true)
}

async function _open(
  ctx: NaviAutoCtx,
) {
  const { naData } = ctx
  if(naData.show) return
  naData.enable = true
  ctx.emits("naviautochangeed", true)
  await liuUtil.waitAFrame()
  if(naData.enable) naData.show = true
}

async function _close(
  ctx: NaviAutoCtx,
) {
  const { naData } = ctx
  if(!naData.enable) return
  naData.show = false
  ctx.emits("naviautochangeed", false)
  await valTool.waitMilli(TRANSITION_DURATION)
  if(!naData.show) naData.enable = false
}


