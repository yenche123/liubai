import { onMounted, onUnmounted, ref, Ref, watch } from "vue";
import { useLayoutStore } from "../../useLayoutStore";
import type { LayoutStore, LayoutType } from "../../useLayoutStore";
import { useWindowSize, useResizeObserver } from "../../../hooks/useVueUse";
import cfg from "../../../config";
import valTool from "../../../utils/basic/val-tool";
import time from "../../../utils/time";
import type { OpenType } from "../../../types/types-view";

const LISTEN_DELAY = 300
let sidebarPxByDrag = cfg.default_sidebar_width   // 存储上一次用户拖动侧边栏后的宽度
let lastWinResizeStamp = 0

interface SidebarData {
  openType: Ref<OpenType>
  minSidebarPx: Ref<number>
  maxSidebarPx: Ref<number>
  isAnimating: Ref<boolean>
}

export function useSidebar() {

  const layoutStore = useLayoutStore()

  const sidebarEl = ref<HTMLElement | null>(null)

  const openType = ref<OpenType>("opened")
  const minSidebarPx = ref(cfg.min_sidebar_width)
  const maxSidebarPx = ref(600)
  const isAnimating = ref(false)    // 为 true 时表示正在进行过度动画

  initSidebar(layoutStore, openType, minSidebarPx, maxSidebarPx)
  listenUserDrag(sidebarEl, layoutStore, openType)
  listenWindowChange(sidebarEl, layoutStore, { openType, minSidebarPx, maxSidebarPx, isAnimating })

  return {
    sidebarEl,
    openType,
    minSidebarPx,
    maxSidebarPx,
    isAnimating,
  }
}


// 监听用户拖动侧边栏
function listenUserDrag(
  sidebarEl: Ref<HTMLElement | null>,
  layoutStore: LayoutStore,
  openType: Ref<OpenType>
) {
  let lastResizeTimeout = 0

  const collectState = () => {
    if(!sidebarEl.value) return
    if(openType.value !== "opened") return
    const newV = sidebarEl.value.offsetWidth
    const oldV = layoutStore.sidebarWidth
    if(newV === oldV) return
    layoutStore.$patch(state => {
      state.changeType = "sidebar"
      state.sidebarWidth = newV
    })
    sidebarPxByDrag = newV
  }

  const whenResizeChange = () => {
    if(lastResizeTimeout) window.clearTimeout(lastResizeTimeout)
    const now = time.getLocalTime()
    const diff = lastWinResizeStamp + LISTEN_DELAY - now
    if(diff > 0) {
      return
    }
    lastResizeTimeout = window.setTimeout(() => {
      collectState()
    }, LISTEN_DELAY)
  }

  const rzObserver = new ResizeObserver(entries => {
    whenResizeChange()
  })
  onMounted(() => {
    rzObserver.observe(sidebarEl.value as HTMLElement)
  })
  onUnmounted(() => {
    rzObserver.disconnect()
  })

}

// 监听窗口发生变化
function listenWindowChange(
  sidebarEl: Ref<HTMLElement | null>,
  layoutStore: LayoutStore,
  sidebarData: SidebarData,
) {
  const { width } = useWindowSize()
  let lastWindowTimeout = 0

  const collectState = async () => {
    const newV = width.value
    const oldV = layoutStore.clientWidth
    const oldSidebarPx = layoutStore.sidebarWidth
    if(newV === oldV) return
    lastWinResizeStamp = time.getLocalTime()
    let { isAnimating, openType, minSidebarPx, maxSidebarPx } = sidebarData

    let newState: Partial<LayoutType> = {
      changeType: "window",
      clientWidth: newV
    }

    // 如果用户已选择关闭侧边栏时
    if(openType.value === "closed_by_user") {
      layoutStore.$patch(newState)
      return
    }

    // 如果是自动关闭侧边栏 并且 窗口小于 700px 时
    if(openType.value === "closed_by_auto" && newV < 700) {
      layoutStore.$patch(newState)
      return
    }

    // 其他情况
    // 先获取最小和最大宽
    
    const { min, max } = getCurrentMinMax(newV)
    console.log("当前窗口宽度: ", newV)
    console.log("min: ", min)
    console.log("max: ", max)
    console.log("sidebarPxByDrag: ", sidebarPxByDrag)
    console.log("oldSidebarPx: ", oldSidebarPx)
    console.log(" ")

    if(oldSidebarPx === 0) {
      // 先判断 侧边栏已关闭的情况
      newState.sidebarWidth = valTool.getValInMinAndMax(sidebarPxByDrag, min, max)
      isAnimating.value = true
      if(newState.sidebarWidth > 0) openType.value = "opened"
    }
    else if(sidebarPxByDrag !== oldSidebarPx) {
      // sidebarPxByDrag 和 oldSidebarPx 不一致时
      newState.sidebarWidth = valTool.getValInMinAndMax(sidebarPxByDrag, min, max)
      isAnimating.value = true
    }
    else if(oldSidebarPx < min) {
      // 判断宽高是否在范围内，如果不在就修改之
      newState.sidebarWidth = min
      isAnimating.value = true
    }
    else if(oldSidebarPx > max) {
      newState.sidebarWidth = max
      isAnimating.value = true
    }
    
    // 查看是否要设置成关闭侧边栏
    if(max === 0) {
      openType.value = "closed_by_auto"
    }

    // 设置数据
    if(min > 0) minSidebarPx.value = min
    if(max > 0) maxSidebarPx.value = max
    // 广播数据
    console.log("看一下广播的数据........")
    console.log(newState)
    console.log(" ")
    layoutStore.$patch(newState)
    checkSidebarElement(sidebarEl, layoutStore, openType)

    // 如果在动画中 把动画切回来
    if(isAnimating.value) {
      await valTool.waitMilli(301)
      isAnimating.value = false
    }
  }

  const whenWindowChange = () => {
    if(lastWindowTimeout) clearTimeout(lastWindowTimeout)
    lastWindowTimeout = window.setTimeout(() => {
      collectState()
    }, LISTEN_DELAY)
  }

  // watch 挂在 setup 周期内 所以不需要在 onUnmounted 手写销毁，vue 会自动完成
  watch(width, (newV, oldV) => {
    whenWindowChange()
  })
}

// 由于窗口变化后 sidebar 可能被浏览器乱动，所以这里做一个检查
async function checkSidebarElement(
  sidebarEl: Ref<HTMLElement | null>,
  layoutStore: LayoutStore,
  openType: Ref<OpenType>
) {
  await valTool.waitMilli(LISTEN_DELAY + 50)
  if(!sidebarEl.value) return
  if(openType.value !== "opened") return
  const newV = sidebarEl.value.offsetWidth
  const oldV = layoutStore.sidebarWidth
  const diff = Math.abs(newV - oldV)
  if(diff < 1) return
  console.log("发现 sidebar 的宽度不正确........")
  console.log("newV: ", newV)
  console.log("oldV: ", oldV)
  console.log(" ")
  layoutStore.$patch(state => {
    state.changeType = ""
    state.sidebarWidth = newV
  })
}

// 获取可拖动的最大值和最小值
function getCurrentMinMax(cw: number): { min: number, max: number } {
  if(cw <= 600) return { min: 0, max: 0 }
  if(cw <= 720) return { min: 250, max: Math.max(260, cw / 2.5) }
  if(cw <= 1080) return { min: 280, max: cw / 2 }
  if(cw <= 1560) return { min: 300, max: Math.min(700, cw / 2) }
  return { min: 350, max: 800 }
}

// 初始化 sidebar 的宽度
function initSidebar(
  layoutStore: LayoutStore,
  openType: Ref<OpenType>,
  minSidebarPx: Ref<number>,
  maxSidebarPx: Ref<number>
) {
  const { width } = useWindowSize()
  const w = width.value
  if(w < 600) {
    openType.value = "closed_by_auto"
  }
  const { min, max } = getCurrentMinMax(w)
  if(min > 0) minSidebarPx.value = min
  if(max > 0) maxSidebarPx.value = max

  let newState: Partial<LayoutType> = {
    changeType: "window",
    clientWidth: w
  }

  if(sidebarPxByDrag < min) {
    newState.sidebarWidth = min
  } 
  else if(sidebarPxByDrag > max) {
    newState.sidebarWidth = max
  }

  if(newState.sidebarWidth !== undefined) {
    lastWinResizeStamp = time.getLocalTime()
    layoutStore.$patch(newState)
  }
}