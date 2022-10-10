
import { nextTick, onActivated, onDeactivated, reactive, ref, watch } from "vue";
import { OpenType } from "../../../types/types-view";
import { useLayoutStore } from "../../useLayoutStore";
import type { LayoutStore, LayoutType } from "../../useLayoutStore";
import cfg from "../../../config";
import { useRouteAndLiuRouter } from "../../../routes/liu-router"
import type { LocationQuery } from "vue-router"

interface VvData {
  openType: OpenType
  minVvPx: number
  detailViewPx: number
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
    minVvPx: cfg.min_detailview_width,
    detailViewPx: cfg.default_sidebar_width,
    maxVvPx: cfg.default_detailview_width,
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

function openDetailView(vvData: VvData, emits: Emits) {
  vvData.openType = "opened"
  emits("widthchange", cfg.default_detailview_width)
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
