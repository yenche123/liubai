
import { 
  inject,
  nextTick, 
  onActivated, 
  onDeactivated,
  provide, 
  reactive,
  ref, 
  toRef, 
  watch 
} from "vue";
import type { Ref } from "vue";
import type { OpenType } from "~/types/types-view";
import { useLayoutStore } from "../../useLayoutStore";
import cfg from "~/config";
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { LocationQuery } from "vue-router"
import { useWindowSize } from "~/hooks/useVueUse"
import time from "~/utils/basic/time";
import valTool from "~/utils/basic/val-tool";
import { outterWidthKey, tapMainViewStampKey } from "~/utils/provide-keys"
import liuApi from "~/utils/liu-api";
import liuUtil from "~/utils/liu-util";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import type { VvData, VvEmits } from "./types";

const LISTEN_DELAY = 300
const layoutStore = useLayoutStore()

export function useViceView(emits: VvEmits) {  
  const vvEl = ref<HTMLElement | null>(null) 
  const { vvData } = initViceView()

  const vvPx = toRef(vvData, "viceViewPx")
  provide(outterWidthKey, vvPx)

  listenRouteChange(vvData, emits)
  listenIfActivated(vvData)
  listenParentChange(vvData, emits, vvEl)
  const { onResizing } = initResizing(vvData, emits)
  const {
    onVvMouseEnter,
    onVvMouseLeave,
  } = initMouse(vvData)

  // 接收来自子组件期望的最小尺寸，若最小尺寸小于等于 0，那么
  // 最小尺寸从 cfg 里取值
  const onIntendedMinVvPxChange = (newV: number) => {
    if(newV <= 0) newV = cfg.min_viceview_width
    if(vvData.intendedMinVvPx !== newV || vvData.viceViewPx < newV) {
      vvData.intendedMinVvPx = newV
      recalculatePx(vvData, emits)
    }
  }

  // 处理 main-view 被点击的情况
  handleMainViewTapped(vvData)

  return { 
    vvData, 
    onResizing,
    onVvMouseEnter,
    onVvMouseLeave,
    onIntendedMinVvPxChange,
  }
}

function handleMainViewTapped(
  vvData: VvData,
) {
  const { route, router } = useRouteAndLiuRouter()

  // 接收来自 page 的 tapMvStamp，當 tapMvStamp 變化時，代表有被點擊
  const tapMvStamp = inject(tapMainViewStampKey, ref(0))
  watch(tapMvStamp, (newV, oldV) => {
    if(newV <= 0) return
    const diff = newV - oldV
    if(diff < 600) return
    if(vvData.openType !== "opened") return
    if(!vvData.shadow) return

    // 去控制路由，关闭侧边栏
    const newQuery = liuUtil.getDefaultRouteQuery(route)
    router.replaceWithNewQuery(route, newQuery)
  })
}



function initViceView() {
  let defaultPx = cfg.default_viceview_width
  const { width, height } = useWindowSize()
  const w = width.value
  if(w > 1280) {
    defaultPx = Math.max(defaultPx, Math.round(w / 3.33))
  }
  
  const cha = liuApi.getCharacteristic()

  const vvData = reactive<VvData>({
    openType: "closed_by_auto",
    intendedMinVvPx: cfg.min_viceview_width,
    minVvPx: cfg.min_viceview_width,
    viceViewPx: defaultPx,
    vvHeightPx: height.value,
    maxVvPx: defaultPx,
    isAnimating: false,
    isActivate: true,
    lastParentResizeStamp: 0,
    lastOpenStamp: 0,
    shadow: false,
  })

  watch(height, (newV) => {
    vvData.vvHeightPx = newV
  })

  return { vvData }
}

function initMouse(
  vvData: VvData,
) {
  let lastLeave: LiuTimeout
  const onVvMouseEnter = () => {
    if(lastLeave) clearTimeout(lastLeave)
  }

  const onVvMouseLeave = () => {
    if(lastLeave) clearTimeout(lastLeave)
    lastLeave = setTimeout(() => {
      lastLeave = undefined

      // 判断是不是才刚打开，若是则不要隐藏
      const diff = time.getLocalTime() - vvData.lastOpenStamp
      if(diff < 900) return
      
    }, 600)
  }

  return {
    onVvMouseEnter,
    onVvMouseLeave,
  }
}


function initResizing(
  vvData: VvData, 
  emits: VvEmits,
) {
  let lastResizeTimeout: LiuTimeout

  const _isJustParentChange = (): boolean => {
    const now = time.getLocalTime()
    const diff = vvData.lastParentResizeStamp + LISTEN_DELAY + 50 - now
    if(diff > 0) return true
    return false
  }

  const collectState = () => {
    if(vvData.openType !== "opened") return
    let newV = vvData.viceViewPx
    vvData.shadow = judgeIfShadow(vvData)
    emits("widthchange", newV)
  }

  const onResizing = (
    left: number,
    top: number,
    width: number,
    height: number,
  ) => {
    vvData.viceViewPx = width

    if(_isJustParentChange()) return
    if(!vvData.isActivate) return
    if(lastResizeTimeout) clearTimeout(lastResizeTimeout)
    lastResizeTimeout = setTimeout(() => {
      lastResizeTimeout = undefined
      collectState()
    }, LISTEN_DELAY)
  }

  return { onResizing }
}

function listenRouteChange(
  vvData: VvData, 
  emits: VvEmits,
) {
  let located = ""
  const { route } = useRouteAndLiuRouter()

  const whenQueryChange = (
    newQuery: LocationQuery,
  ) => {
    const openRequired = liuUtil.needToOpenViceView(newQuery)
    if(openRequired && vvData.openType !== "opened") {
      openViceView(vvData, emits)
      return
    }

    if(!openRequired && vvData.openType === "opened") {
      closeViceView(vvData, emits)
      return
    }
  }

  watch(() => route.query, async (newQuery, oldQuery) => {
    await nextTick()
    if(route.name !== located) {
      return
    }
    whenQueryChange(newQuery)
  })

  onActivated(() => {
    if(located) return
    if(typeof route.name === "string") {
      located = route.name
    }
    whenQueryChange(route.query)
  })
}

// 获取最小和最大宽度
function getMinAndMax(
  vvData: VvData
) {
  const { width } = useWindowSize()
  const winW = width.value
  const max = winW - layoutStore.sidebarWidth
  const min = Math.min(max, vvData.intendedMinVvPx)
  return { max, min }
}


function openViceView(
  vvData: VvData, 
  emits: VvEmits,
) {
  const { max, min } = getMinAndMax(vvData)
  vvData.lastOpenStamp = time.getLocalTime()
  vvData.minVvPx = min
  vvData.maxVvPx = max
  if(vvData.viceViewPx > max) vvData.viceViewPx = max
  else if(vvData.viceViewPx < min) vvData.viceViewPx = min
  vvData.openType = "opened"
  vvData.shadow = judgeIfShadow(vvData)

  const cha = liuApi.getCharacteristic()

  emits("widthchange", vvData.viceViewPx)
}

function closeViceView(
  vvData: VvData, 
  emits: VvEmits, 
  openType: OpenType = "closed_by_user"
) {
  vvData.openType = openType
  emits("widthchange", 0)
}

function listenIfActivated(vvData: VvData) {
  onActivated(() => {
    vvData.isActivate = true
  })

  onDeactivated(() => {
    vvData.isActivate = false
  })
}


// 监听 sidebar 或者 window 窗口的宽度变化
function listenParentChange(
  vvData: VvData, 
  emits: VvEmits,
  vvEl: Ref<HTMLElement | null>
) {
  layoutStore.$subscribe(async (mutation, state) => {
    if(vvData.openType !== "opened") return
    recalculatePx(vvData, emits)
  })
}

async function recalculatePx(
  vvData: VvData, 
  emits: VvEmits,
) {
  let vvPx = vvData.viceViewPx
  const { min, max } = getMinAndMax(vvData)
  if(vvPx < min) vvPx = min
  if(vvPx > max) vvPx = max

  if(vvPx !== vvData.viceViewPx) {
    vvData.isAnimating = true
    vvData.viceViewPx = vvPx
    emits("widthchange", vvPx)
    await nextTick()
  }
  
  vvData.lastParentResizeStamp = time.getLocalTime()
  vvData.minVvPx = min
  vvData.maxVvPx = max
  vvData.shadow = judgeIfShadow(vvData)

  if(vvData.isAnimating) {
    await valTool.waitMilli(LISTEN_DELAY + cfg.frame_duration)
    vvData.isAnimating = false
  }
}


// 此处逻辑必须与 useMainView "监听右边侧边栏的改变" 一致
function judgeIfShadow(vvData: VvData) {
  let { sidebarWidth, clientWidth } = layoutStore

  const realSidebarPx = liuUtil.calibrateSidebarWidth(sidebarWidth)
  const tmpCenter = clientWidth - realSidebarPx - vvData.viceViewPx
  const centerRight = clientWidth - realSidebarPx
  const criticalValue = liuUtil.getMainViewCriticalValue(clientWidth, centerRight)

  if(tmpCenter < criticalValue) return true
  return false
}



