import { onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, Ref, watch } from "vue";
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

interface SbData {
  openType: OpenType
  minSidebarPx: number
  firstSidebarPx: number
  maxSidebarPx: number
  isAnimating: boolean
  isActivate: boolean
}

const sbData = reactive<SbData>({
  openType: "opened",
  minSidebarPx: cfg.min_sidebar_width,
  firstSidebarPx: cfg.default_sidebar_width,
  maxSidebarPx: 600,
  isAnimating: false,
  isActivate: true,
})


export function useSidebar() {

  const layoutStore = useLayoutStore()
  const sidebarEl = ref<HTMLElement | null>(null)

  initSidebar(layoutStore)
  listenUserDrag(sidebarEl, layoutStore)
  listenWindowChange(sidebarEl, layoutStore)
  listenIfActivated()

  return {
    sidebarEl,
    sbData,
  }
}

function listenIfActivated() {
  onActivated(() => {
    sbData.isActivate = true
  })

  onDeactivated(() => {
    sbData.isActivate = false
  })
}


// 监听用户拖动侧边栏
function listenUserDrag(
  sidebarEl: Ref<HTMLElement | null>,
  layoutStore: LayoutStore,
) {
  let lastResizeTimeout = 0

  const collectState = () => {
    if(!sbData.isActivate) return
    if(!sidebarEl.value) return
    if(sbData.openType !== "opened") return
    const newV = sidebarEl.value.offsetWidth
    const oldV = layoutStore.sidebarWidth
    if(newV === oldV) return
    console.log("sidebarPxByDrag 发生变化................ ", newV)
    console.log(" ")
    layoutStore.$patch(state => {
      state.changeType = "sidebar"
      state.sidebarWidth = newV
    })
    sidebarPxByDrag = newV
  }

  const whenResizeChange = () => {
    if(lastResizeTimeout) window.clearTimeout(lastResizeTimeout)
    if(isJustWindowResize()) return
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

// 是否刚刚有发生窗口变化
function isJustWindowResize(): boolean {
  const now = time.getLocalTime()
  const diff = lastWinResizeStamp + LISTEN_DELAY + 50 - now
  if(diff > 0) return true
  return false
}

// 监听窗口发生变化
function listenWindowChange(
  sidebarEl: Ref<HTMLElement | null>,
  layoutStore: LayoutStore,
) {
  const { width } = useWindowSize()
  let lastWindowTimeout = 0

  const collectState = async () => {
    const newV = width.value
    const oldV = layoutStore.clientWidth
    const oldSidebarPx = layoutStore.sidebarWidth
    if(newV === oldV) return
    lastWinResizeStamp = time.getLocalTime()

    let newState: Partial<LayoutType> = {
      changeType: "window",
      clientWidth: newV
    }

    // 如果用户已选择关闭侧边栏时
    if(sbData.openType === "closed_by_user") {
      layoutStore.$patch(newState)
      return
    }

    // 如果是自动关闭侧边栏 并且 窗口小于 700px 时
    if(sbData.openType === "closed_by_auto" && newV < 700) {
      layoutStore.$patch(newState)
      return
    }

    // 其他情况
    // 先获取最小和最大宽
    
    const { min, max } = getCurrentMinMax(newV)
    // console.log("当前窗口宽度: ", newV)
    // console.log("min: ", min)
    // console.log("max: ", max)
    // console.log("sidebarPxByDrag: ", sidebarPxByDrag)
    // console.log("oldSidebarPx: ", oldSidebarPx)
    // console.log(" ")

    if(oldSidebarPx === 0) {
      // 先判断 侧边栏已关闭的情况
      newState.sidebarWidth = valTool.getValInMinAndMax(sidebarPxByDrag, min, max)
      if(newState.sidebarWidth > 0) sbData.openType = "opened"
    }

    sbData.isAnimating = true
    
    // 查看是否要设置成关闭侧边栏
    if(max === 0) {
      sbData.openType = "closed_by_auto"
    }

    // 设置数据
    if(min > 0) sbData.minSidebarPx = min
    if(max > 0) sbData.maxSidebarPx = max

    // 等待 316ms 执行动画
    await valTool.waitMilli(LISTEN_DELAY + 16)

    sbData.isAnimating = false

    // 动画执行后，更新 store 的 sidebarWidth
    if(max > 0 && sidebarEl.value) {
      newState.sidebarWidth = sidebarEl.value.offsetWidth
    }
    else {
      newState.sidebarWidth = 0
    }

    // 广播数据
    layoutStore.$patch(newState)
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
) {
  const { width } = useWindowSize()
  const w = width.value
  let newState: Partial<LayoutType> = {
    changeType: "window",
    clientWidth: w
  }

  
  const { min, max } = getCurrentMinMax(w)
  if(min > 0) sbData.minSidebarPx = min
  if(max > 0) sbData.maxSidebarPx = max

  const d1 = sidebarPxByDrag
  const d2 = layoutStore.sidebarWidth
  const d3 = cfg.default_sidebar_width

  // console.log("sidebar 正在初始化..........")
  // console.log("手动拖动 sidebar 的宽为: ", d1)
  // console.log("store 存储 main-view 左侧的宽:", d2)
  // console.log("默认的 sidebar 宽为:   ", d3)
  // console.log("min: ", min)
  // console.log("max: ", max)
  // console.log(" ")

  if(w < 600 && sbData.openType === "opened") {
    // console.log("发现 窗口宽度不足 600px，但之前却是打开状态")
    // console.log("则优先采纳 store 的.........")
    sbData.openType = "closed_by_auto"
    sbData.firstSidebarPx = d2
    sidebarPxByDrag = d2
    newState.sidebarWidth = 0
  }
  else if(d2 === 0) {
    // console.log("发现侧边栏 之前已是被关闭状态")
    // console.log("则 firstSidebarPx 设置为上次拖动的宽度")
    sbData.firstSidebarPx = sidebarPxByDrag
  }
  else if(d1 !== d2 || d2 !== d3) {
    // console.log("发现侧边栏 之前就是打开状态(store 不为 0)，但三值有所不同")
    // console.log("则优先采纳 store 的")
    sbData.firstSidebarPx = d2
    sidebarPxByDrag = d2
  }

  // 如果当前是 打开状态 考虑一下 min 和 max
  if(sbData.openType === "opened") {
    if(sidebarPxByDrag < min) {
      sbData.firstSidebarPx = min
      sidebarPxByDrag = min
      newState.sidebarWidth = min
    } 
    else if(sidebarPxByDrag > max) {
      sbData.firstSidebarPx = max
      sidebarPxByDrag = max
      newState.sidebarWidth = max
    }
  }

  if(newState.sidebarWidth !== undefined) {
    lastWinResizeStamp = time.getLocalTime()
    layoutStore.$patch(newState)
  }
}