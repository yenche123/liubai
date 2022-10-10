
import { onActivated, onDeactivated, reactive, ref, watch } from "vue";
import { OpenType } from "../../../types/types-view";
import { useLayoutStore } from "../../useLayoutStore";
import type { LayoutStore, LayoutType } from "../../useLayoutStore";
import cfg from "../../../config";
import { useRouteAndLiuRouter } from "../../../routes/liu-router"
import type { LocationQuery } from "vue-router"

interface DvData {
  openType: OpenType
  minDvPx: number
  firstDvPx: number
  maxDvPx: number
  isAnimating: boolean
  isActivate: boolean
}

export function useDetailView() {

  const layoutStore = useLayoutStore()
  const dvEl = ref<HTMLElement | null>(null) 

  const dvData = reactive<DvData>({
    openType: "closed_by_auto",
    minDvPx: cfg.min_detailview_width,
    firstDvPx: cfg.default_sidebar_width,
    maxDvPx: cfg.default_detailview_width,
    isAnimating: false,
    isActivate: true,
  })

  initDetailView(layoutStore, dvData)
  listenRouteChange(dvData)
  listenIfActivated(dvData)

  return { dvEl, dvData }
}

function listenRouteChange(dvData: DvData) {
  const { route } = useRouteAndLiuRouter()

  const whenQueryChange = (
    newQuery: LocationQuery, 
    oldQuery: LocationQuery
  ) => {

  }

  watch(() => route.query, (newQuery, oldQuery) => {
    if(!dvData.isActivate) return
    whenQueryChange(newQuery, oldQuery)
  })
}


function initDetailView(
  layoutStore: LayoutStore, 
  dvData: DvData
) {


}

function listenIfActivated(dvData: DvData) {
  onActivated(() => {
    dvData.isActivate = true
  })

  onDeactivated(() => {
    dvData.isActivate = false
  })
}
