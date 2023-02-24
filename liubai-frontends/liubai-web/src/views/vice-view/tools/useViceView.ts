
import { 
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
import { outterWidthKey } from "~/utils/provide-keys"
import liuApi from "~/utils/liu-api";
import liuUtil from "~/utils/liu-util";

interface VvData {
  openType: OpenType
  minVvPx: number
  viceViewPx: number
  vvHeightPx: number
  maxVvPx: number
  isAnimating: boolean
  isActivate: boolean
  lastParentResizeStamp: number
  lastOpenStamp: number
  shadow: boolean
  showHandle: boolean
}

interface VvEmits {
  (e: "widthchange", widthPx: number): void
}

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

  return { 
    vvData, 
    onResizing,
    onVvMouseEnter,
    onVvMouseLeave,
  }
}

function initViceView() {
  let defaultPx = cfg.default_viceview_width
  const { width, height } = useWindowSize()
  const w = width.value
  if(w > 1280) {
    defaultPx = Math.max(defaultPx, Math.round(w / 3))
  }
  
  const cha = liuApi.getCharacteristic()
  let showHandle = cha.isMobile

  const vvData = reactive<VvData>({
    openType: "closed_by_auto",
    minVvPx: cfg.min_viceview_width,
    viceViewPx: defaultPx,
    vvHeightPx: height.value,
    maxVvPx: defaultPx,
    isAnimating: false,
    isActivate: true,
    lastParentResizeStamp: 0,
    lastOpenStamp: 0,
    shadow: false,
    showHandle,
  })

  watch(height, (newV) => {
    vvData.vvHeightPx = newV
  })

  return { vvData }
}

function initMouse(
  vvData: VvData,
) {
  let lastLeave = 0
  const onVvMouseEnter = () => {
    if(lastLeave) clearTimeout(lastLeave)
    vvData.showHandle = true
  }

  const onVvMouseLeave = () => {
    if(lastLeave) clearTimeout(lastLeave)
    lastLeave = setTimeout(() => {
      lastLeave = 0

      // 判断是不是才刚打开，若是则不要隐藏
      const diff = time.getLocalTime() - vvData.lastOpenStamp
      if(diff < 900) return
      
      vvData.showHandle = false
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
  let lastResizeTimeout = 0

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
      lastResizeTimeout = 0
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
function getMinAndMax() {
  const { width } = useWindowSize()
  const winW = width.value
  const max = winW - layoutStore.sidebarWidth
  const min = Math.min(max, cfg.min_viceview_width)
  return { max, min }
}


function openViceView(
  vvData: VvData, 
  emits: VvEmits,
) {
  const { max, min } = getMinAndMax()
  vvData.lastOpenStamp = time.getLocalTime()
  vvData.minVvPx = min
  vvData.maxVvPx = max
  if(vvData.viceViewPx > max) vvData.viceViewPx = max
  else if(vvData.viceViewPx < min) vvData.viceViewPx = min
  vvData.openType = "opened"
  vvData.shadow = judgeIfShadow(vvData)

  const cha = liuApi.getCharacteristic()
  if(cha.isMobile) vvData.showHandle = true

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

    let vvPx = vvData.viceViewPx
    const { min, max } = getMinAndMax()
    if(vvPx < min) vvPx = min
    if(vvPx > max) vvPx = max

    vvData.isAnimating = true
    vvData.lastParentResizeStamp = time.getLocalTime()
    vvData.viceViewPx = vvPx
    vvData.minVvPx = min
    vvData.maxVvPx = max
    vvData.shadow = judgeIfShadow(vvData)

    emits("widthchange", vvPx)

    await valTool.waitMilli(LISTEN_DELAY + 16)
    vvData.isAnimating = false
  })
}

function judgeIfShadow(vvData: VvData) {
  let { sidebarWidth, clientWidth } = layoutStore
  const tmpCenter = clientWidth - sidebarWidth - vvData.viceViewPx
  const centerRight = clientWidth - sidebarWidth
  const criticalValue = Math.max(cfg.min_mainview_width, centerRight / 4)

  if(tmpCenter < criticalValue) return true
  return false
}



