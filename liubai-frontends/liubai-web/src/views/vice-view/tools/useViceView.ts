
import { nextTick, onActivated, onDeactivated, reactive, ref, watch } from "vue";
import { OpenType } from "../../../types/types-view";
import { useLayoutStore } from "../../useLayoutStore";
import cfg from "../../../config";
import { useRouteAndLiuRouter } from "../../../routes/liu-router"
import type { LocationQuery } from "vue-router"
import { useWindowSize } from "../../../hooks/useVueUse"

interface VvData {
  openType: OpenType
  minVvPx: number
  viceViewPx: number
  maxVvPx: number
  isAnimating: boolean
  isActivate: boolean
}

interface Emits {
  (e: "widthchange", widthPx: number): void
}


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
  })

  initViceView(vvData)
  listenRouteChange(vvData, emits)
  listenIfActivated(vvData)

  return { vvEl, vvData }
}

function listenRouteChange(vvData: VvData, emits: Emits) {
  const { route } = useRouteAndLiuRouter()

  const whenQueryChange = (
    newQuery: LocationQuery, 
    oldQuery?: LocationQuery
  ) => {
    if(newQuery.cid && vvData.openType !== "opened") {
      openDetailView(vvData, emits)
      return
    }

    if(!newQuery.cid && vvData.openType === "opened") {
      closeDetailView(vvData, emits)
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

// 获取最小和最大宽度
function getMinAndMax() {
  const { width } = useWindowSize()
  const winW = width.value
  const max = winW - layoutStore.sidebarWidth
  const min = Math.min(max, cfg.min_viceview_width)
  return { max, min }
}

function openDetailView(vvData: VvData, emits: Emits) {
  const { max, min } = getMinAndMax()
  vvData.minVvPx = min
  vvData.maxVvPx = max
  if(vvData.viceViewPx > max) vvData.viceViewPx = max
  else if(vvData.viceViewPx < min) vvData.viceViewPx = min
  vvData.openType = "opened"


  console.log("min: ", min)
  console.log("max: ", max)
  console.log("viceViewPx: ", vvData.viceViewPx)
  console.log(" ")


  emits("widthchange", vvData.viceViewPx)
}

function closeDetailView(vvData: VvData, emits: Emits, openType: OpenType = "closed_by_user") {
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
    console.log("onDeactivated.................")
    vvData.isActivate = false
  })
}
