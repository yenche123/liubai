import { inject, ref, watch } from "vue";
import type { Ref } from "vue";
import { useLayoutStore } from "~/views/useLayoutStore";
import type { LayoutStore } from "~/views/useLayoutStore";
import { storeToRefs } from "pinia";
import valTool from "~/utils/basic/val-tool";
import { svScollingKey, svBottomUpKey } from "~/utils/provide-keys";
import sideBar from "~/views/side-bar";
import { useWindowSize } from "~/hooks/useVueUse";
import cfg from "~/config";
import type { NaviAutoEmits } from "./types"

const TRANSITION_DURATION = 300

interface NaviAutoCtx {
  enable: Ref<boolean>
  show: Ref<boolean>
  shadow: Ref<boolean>
  scrollPosition: Ref<number>
  layout: LayoutStore,
  windowWidth: Ref<number>,
  emits: NaviAutoEmits,
}

export function useNaviAuto(
  emits: NaviAutoEmits,
) {
  
  const enable = ref(false)
  const show = ref(false)
  const shadow = ref(false)

  // 引入上下文
  const layout = useLayoutStore()
  const scrollPosition = inject(svScollingKey, ref(0))

  // 窗口宽度
  const { width: windowWidth } = useWindowSize()

  const ctx = {
    enable,
    show,
    shadow,
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
    if(!enable.value) return
    judgeShadow(newV, shadow)
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
    enable,
    show,
    shadow,
    onTapMenu,
    onTapTitle,
  }
}

function judgeShadow(
  sT: number,
  shadow: Ref<boolean>
) {
  if(sT >= 40 && !shadow.value) shadow.value = true
  else if(sT <= 20 && shadow.value) shadow.value = false
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
  judgeShadow(ctx.scrollPosition.value, ctx.shadow)
}

// 聆听窗口变化
function listenWindowChange(
  ctx: NaviAutoCtx,
) {

  const whenWindowChange = (winWidthPx: number) => {
    const { sidebarWidth, sidebarStatus } = ctx.layout
    if(sidebarWidth > 0 || sidebarStatus === "fullscreen") return

    const { enable, show } = ctx

    if(winWidthPx < cfg.sidebar_close_point && !enable.value) {
      _open(ctx)
    }
    else if(winWidthPx >= cfg.sidebar_open_point && show.value) {
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
  ctx.enable.value = true
  ctx.show.value = true
  ctx.emits("naviautochangeed", true)
}

async function _open(
  ctx: NaviAutoCtx,
) {
  if(ctx.show.value) return
  ctx.enable.value = true
  ctx.emits("naviautochangeed", true)
  await valTool.waitMilli(16)
  ctx.show.value = true
}

async function _close(
  ctx: NaviAutoCtx,
) {
  if(!ctx.enable.value) return
  ctx.show.value = false
  ctx.emits("naviautochangeed", false)
  await valTool.waitMilli(TRANSITION_DURATION)
  ctx.enable.value = false
}


