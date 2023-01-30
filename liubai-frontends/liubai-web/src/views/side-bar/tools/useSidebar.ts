import { onActivated, onDeactivated, reactive, watch } from "vue";
import { useLayoutStore } from "../../useLayoutStore";
import type { LayoutStore, LayoutType } from "../../useLayoutStore";
import { useWindowSize } from "~/hooks/useVueUse";
import cfg from "~/config";
import valTool from "~/utils/basic/val-tool";
import time from "~/utils/basic/time";
import type { OpenType } from "~/types/types-view";
import { storeToRefs } from "pinia";
import liuApi from "~/utils/liu-api";

const LISTEN_DELAY = 300
let sidebarPxByDrag = cfg.default_sidebar_width   // 存储上一次用户拖动侧边栏后视觉上呈现的宽度
let lastWinResizeStamp = 0

interface SbData {
  openType: OpenType
  minSidebarPx: number
  sidebarWidthPx: number
  sidebarHeightPx: number
  maxSidebarPx: number
  isAnimating: boolean
  isActivate: boolean
  showHandle: boolean
}

const sbData = reactive<SbData>({
  openType: "opened",
  minSidebarPx: cfg.min_sidebar_width,
  sidebarWidthPx: cfg.default_sidebar_width,
  sidebarHeightPx: 0,
  maxSidebarPx: 600,
  isAnimating: false,
  isActivate: true,
  showHandle: false,
})

export function useSidebar() {

  const layoutStore = useLayoutStore()
  initSidebar(layoutStore)
  listenWindowChange(layoutStore)
  listenChangeFromOtherComponent(layoutStore)
  listenIfActivated()

  const { onResizing } = initResizing(layoutStore)
  const {
    onSbMouseEnter,
    onSbMouseLeave,
  } = initMouse()
  

  return {
    sbData,
    onResizing,
    onSbMouseEnter,
    onSbMouseLeave,
  }
}

function initMouse() {
  let lastLeave = 0
  const onSbMouseEnter = () => {
    if(lastLeave) clearTimeout(lastLeave)
    sbData.showHandle = true
  }

  const onSbMouseLeave = () => {
    if(lastLeave) clearTimeout(lastLeave)
    lastLeave = setTimeout(() => {
      lastLeave = 0
      sbData.showHandle = false
    }, 600)
  }

  return {
    onSbMouseEnter,
    onSbMouseLeave,
  }
}


function initResizing(
  layoutStore: LayoutStore,
) {
  let lastResizeTimeout = 0

  const collectState = () => {
    if(sbData.openType !== "opened") return
    if(!sbData.showHandle) sbData.showHandle = true
    const newV = sbData.sidebarWidthPx
    const oldV = layoutStore.sidebarWidth
    if(newV === oldV) return
    layoutStore.$patch(state => {
      state.changeType = "sidebar"
      state.sidebarWidth = newV
    })
    sidebarPxByDrag = newV
  }

  const onResizing = (
    left: number,
    top: number,
    width: number,
    height: number,
  ) => {
    sbData.sidebarWidthPx = width

    if(isJustWindowResize()) return
    if(!sbData.isActivate) return
    if(lastResizeTimeout) clearTimeout(lastResizeTimeout)
    lastResizeTimeout = setTimeout(() => {
      lastResizeTimeout = 0
      collectState()
    }, LISTEN_DELAY)
  }

  return { onResizing }
}


function listenIfActivated() {
  onActivated(() => {
    sbData.isActivate = true
  })

  onDeactivated(() => {
    sbData.isActivate = false
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
  layoutStore: LayoutStore,
) {
  const { width } = useWindowSize()
  let lastWindowTimeout = 0

  const collectState = async () => {
    recalculate(layoutStore)
  }

  const whenWindowChange = () => {
    if(lastWindowTimeout) clearTimeout(lastWindowTimeout)
    lastWindowTimeout = setTimeout(() => {
      collectState()
    }, LISTEN_DELAY)
  }

  // watch 挂在 setup 周期内 所以不需要在 onUnmounted 手写销毁，vue 会自动完成
  watch(width, (newV, oldV) => {
    whenWindowChange()
  })
}

async function recalculate(
  layoutStore: LayoutStore,
) {
  const { width } = useWindowSize()
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

  // 其他情况: 侧边栏必须是打开的情况
  
  const { min, max } = getCurrentMinMax(newV)
  const sidebarPxStyle = sbData.sidebarWidthPx
  // console.log("当前窗口宽度: ", newV)
  // console.log("min: ", min)
  // console.log("max: ", max)
  // console.log("sidebarPxByDrag 这个很重要: ", sidebarPxByDrag)
  // console.log("oldSidebarPx: ", oldSidebarPx)
  // console.log(" ")

  newState.sidebarWidth = valTool.getValInMinAndMax(sidebarPxStyle, min, max)

  if(oldSidebarPx === 0) {
    // 先判断 侧边栏已关闭的情况
    if(newState.sidebarWidth > 0) sbData.openType = "opened"
  }

  sbData.isAnimating = true
  
  // 查看是否要设置成关闭侧边栏
  if(max === 0) {
    sbData.openType = "closed_by_auto"
  }

  // 设置数据
  if(min > 0) {
    sbData.minSidebarPx = min
    if(sidebarPxStyle < min) sbData.sidebarWidthPx = min 
  }
  if(max > 0) {
    sbData.maxSidebarPx = max
    if(max < sidebarPxStyle) sbData.sidebarWidthPx = max
  }

  // 广播数据
  layoutStore.$patch(newState)

  // 等待 316ms 执行动画
  await valTool.waitMilli(LISTEN_DELAY + 16)
  sbData.isAnimating = false
}


// 获取可拖动的最大值和最小值
function getCurrentMinMax(cw: number): { min: number, max: number } {
  const _min = cfg.min_sidebar_width
  if(cw <= 600) return { min: _min, max: 0 }
  if(cw <= 720) return { min: _min, max: Math.max(260, cw / 2.5) }
  if(cw <= 1080) return { min: _min, max: cw / 2 }
  if(cw <= 1560) return { min: _min, max: Math.min(700, cw / 2) }
  return { min: _min, max: 800 }
}

// 初始化 sidebar 的宽度
function initSidebar(
  layoutStore: LayoutStore,
) {
  const { width, height } = useWindowSize()
  const cha = liuApi.getCharacteristic()
  if(cha.isMobile) sbData.showHandle = true

  sbData.sidebarHeightPx = height.value
  watch(height, (newV) => {
    sbData.sidebarHeightPx = newV
  })


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
    sbData.sidebarWidthPx = d2
    sidebarPxByDrag = d2
    newState.sidebarWidth = 0
  }
  else if(d2 === 0) {
    // console.log("发现侧边栏 之前已是被关闭状态")
    // console.log("则 sidebarWidthPx 设置为上次拖动的宽度")
    sbData.sidebarWidthPx = sidebarPxByDrag
  }
  else if(d1 !== d2 || d2 !== d3) {
    // console.log("发现侧边栏 之前就是打开状态(store 不为 0)，但三值有所不同")
    // console.log("则优先采纳 store 的")
    sbData.sidebarWidthPx = d2
    sidebarPxByDrag = d2
  }

  // 如果当前是 打开状态 考虑一下 min 和 max
  if(sbData.openType === "opened") {
    if(sidebarPxByDrag < min) {
      sbData.sidebarWidthPx = min
      sidebarPxByDrag = min
      newState.sidebarWidth = min
    } 
    else if(sidebarPxByDrag > max) {
      sbData.sidebarWidthPx = max
      sidebarPxByDrag = max
      newState.sidebarWidth = max
    }
  }

  if(newState.sidebarWidth !== undefined) {
    lastWinResizeStamp = time.getLocalTime()
    layoutStore.$patch(newState)
  }
}

// 监听来自其他组件的变化
function listenChangeFromOtherComponent(
  layoutStore: LayoutStore,
) {

  const { sidebarStatus } = storeToRefs(layoutStore)

  const _restore = async () => {
    const { width } = useWindowSize()
    const newV = width.value
    let newState: Partial<LayoutType> = {
      changeType: "window",
      clientWidth: newV,
    }
    const { min, max } = getCurrentMinMax(newV)
    const sidebarPxStyle = sbData.sidebarWidthPx
    newState.sidebarWidth = valTool.getValInMinAndMax(sidebarPxStyle, min, max)

    if(newState.sidebarWidth > 0) sbData.openType = "opened"
    else sbData.openType = "closed_by_auto"

    sbData.isAnimating = true
    if(min > 0) {
      sbData.minSidebarPx = min
      if(sidebarPxStyle < min) sbData.sidebarWidthPx = min 
    }
    if(max > 0) {
      sbData.maxSidebarPx = max
      if(max < sidebarPxStyle) sbData.sidebarWidthPx = max
    }

    console.log("打印 sidebarWidthPx: ", sbData.sidebarWidthPx)
    
    // 广播数据
    layoutStore.$patch(newState)

    // 等待 316ms 执行动画
    await valTool.waitMilli(LISTEN_DELAY + 16)
    sbData.isAnimating = false
  }


  const _close = () => {
    layoutStore.$patch({ sidebarWidth: 0 })
    sbData.openType = "closed_by_user"
  }

  watch(sidebarStatus, (newV) => {
    console.log("监听到 sidebarStatus 来自其他组件的变化.....")
    console.log(newV)
    console.log(" ")
    if(newV === "fullscreen") _close()
    else _restore()
  })
}