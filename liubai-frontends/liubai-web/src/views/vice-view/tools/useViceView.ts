
import { 
  nextTick, 
  onActivated, 
  onDeactivated, 
  onMounted, 
  onUnmounted, 
  reactive, 
  Ref, 
  ref, 
  watch 
} from "vue";
import { OpenType } from "../../../types/types-view";
import { useLayoutStore } from "../../useLayoutStore";
import cfg from "../../../config";
import { useRouteAndLiuRouter } from "../../../routes/liu-router"
import type { LocationQuery } from "vue-router"
import { useWindowSize } from "../../../hooks/useVueUse"
import time from "../../../utils/basic/time";
import valTool from "../../../utils/basic/val-tool";

interface VvData {
  openType: OpenType
  minVvPx: number
  viceViewPx: number
  maxVvPx: number
  isAnimating: boolean
  isActivate: boolean
  lastParentResizeStamp: number
  shadow: boolean
}

interface Emits {
  (e: "widthchange", widthPx: number): void
}

const LISTEN_DELAY = 300
const layoutStore = useLayoutStore()

export function useViceView(emits: Emits) {

  
  const vvEl = ref<HTMLElement | null>(null) 

  const vvData = reactive<VvData>({
    openType: "closed_by_auto",
    minVvPx: cfg.min_viceview_width,
    viceViewPx: cfg.default_viceview_width,
    maxVvPx: cfg.default_viceview_width,
    isAnimating: false,
    isActivate: true,
    lastParentResizeStamp: 0,
    shadow: false,
  })

  initViceView(vvData)
  listenUserDrag(vvData, emits, vvEl)
  listenRouteChange(vvData, emits, vvEl)
  listenIfActivated(vvData)
  listenParentChange(vvData, emits, vvEl)

  return { vvEl, vvData }
}

function listenRouteChange(
  vvData: VvData, 
  emits: Emits,
  vvEl: Ref<HTMLElement | null>
) {
  const { route } = useRouteAndLiuRouter()

  const whenQueryChange = (
    newQuery: LocationQuery, 
    oldQuery?: LocationQuery
  ) => {
    const openRequired = judgeIfOpen(newQuery)
    if(openRequired && vvData.openType !== "opened") {
      openViceView(vvData, emits, vvEl)
      return
    }

    if(!openRequired && vvData.openType === "opened") {
      closeViceView(vvData, emits)
      return
    }

  }

  watch(() => route.query, async (newQuery, oldQuery) => {
    await nextTick()
    if(!vvData.isActivate) return
    whenQueryChange(newQuery, oldQuery)
  })

  // 初始化时，先执行一次
  whenQueryChange(route.query)
}

/*********** 根据参数判断是否打开侧边栏  *************/
function judgeIfOpen(newQuery: LocationQuery): boolean {
  let { cid, outq } = newQuery
  if(cid || outq) return true
  return false
}

// 获取最小和最大宽度
function getMinAndMax() {
  const { width } = useWindowSize()
  const winW = width.value
  const max = winW - layoutStore.sidebarWidth
  const min = Math.min(max, cfg.min_viceview_width)
  return { max, min }
}

// 从 vvEl 里获取 style 所设置的宽度
function getViceViewPxFromStyle(
  vvEl: Ref<HTMLElement | null>,
  originalPx: number
): number {
  if(!vvEl.value) return originalPx
  const style = vvEl.value.style
  let widthStr = style.width
  if(!widthStr) {
    const domRect = vvEl.value.getBoundingClientRect()
    return domRect.width
  }

  const idx = widthStr.indexOf("px")
  if(idx > 0) {
    widthStr = widthStr.substring(0, idx)
  }
  let w = Number(widthStr)
  if(isNaN(w)) return originalPx
  return w
}

function openViceView(
  vvData: VvData, 
  emits: Emits,
  vvEl: Ref<HTMLElement | null>  
) {
  const { max, min } = getMinAndMax()
  vvData.minVvPx = min
  vvData.maxVvPx = max
  if(vvData.viceViewPx > max) vvData.viceViewPx = max
  else if(vvData.viceViewPx < min) vvData.viceViewPx = min
  else vvData.viceViewPx = getViceViewPxFromStyle(vvEl, vvData.viceViewPx)
  vvData.openType = "opened"
  vvData.shadow = judgeIfShadow(vvData)

  emits("widthchange", vvData.viceViewPx)
}

function closeViceView(
  vvData: VvData, 
  emits: Emits, 
  openType: OpenType = "closed_by_user"
) {
  vvData.openType = openType
  emits("widthchange", 0)
}


function initViceView( 
  vvData: VvData
) {


}

function listenIfActivated(vvData: VvData) {
  onActivated(() => {
    vvData.isActivate = true
  })

  onDeactivated(() => {
    vvData.isActivate = false
  })
}

// 监听自身的拖动
function listenUserDrag(
  vvData: VvData, 
  emits: Emits,
  vvEl: Ref<HTMLElement | null>
) {

  let lastResizeTimeout = 0

  const _isJustParentChange = (): boolean => {
    const now = time.getLocalTime()
    const diff = vvData.lastParentResizeStamp + LISTEN_DELAY + 50 - now
    if(diff > 0) return true
    return false
  }

  const collectState = () => {
    if(!vvEl.value) return
    if(vvData.openType !== "opened") return
    const newV = vvEl.value.offsetWidth
    if(newV === vvData.viceViewPx) return
    vvData.viceViewPx = newV
    vvData.shadow = judgeIfShadow(vvData)
    emits("widthchange", newV)
  }

  const whenResizeChange = () => {
    if(_isJustParentChange()) return
    if(!vvData.isActivate) return
    if(lastResizeTimeout) window.clearTimeout(lastResizeTimeout)
    lastResizeTimeout = window.setTimeout(() => {
      collectState()
    }, LISTEN_DELAY)
  }

  const rzObserver = new ResizeObserver(entries => {
    whenResizeChange()
  })
  onMounted(() => {
    rzObserver.observe(vvEl.value as HTMLElement)
  })
  onUnmounted(() => {
    rzObserver.disconnect()
  })
}

// 监听 sidebar 或者 window 窗口的宽度变化
function listenParentChange(
  vvData: VvData, 
  emits: Emits,
  vvEl: Ref<HTMLElement | null>
) {
  layoutStore.$subscribe(async (mutation, state) => {
    if(vvData.openType !== "opened") return

    let vvPx = getViceViewPxFromStyle(vvEl, vvData.viceViewPx)
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
  const criticalValue = Math.max(cfg.min_mainview_width, centerRight / 3)

  if(tmpCenter < criticalValue) return true
  return false
}



