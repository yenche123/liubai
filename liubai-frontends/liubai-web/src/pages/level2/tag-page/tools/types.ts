import type { PageState } from "~/types/types-atom"
import type { BasicView } from "~/types/types-view"
import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { Ref } from "vue"

export interface TpView extends BasicView {
  state: PageState
  tagName: string
  goToTop: number
  scrollPosition: number
}


export interface TpData {
  list: TpView[]
}

export interface TpCtx2 {
  route: RouteLocationNormalizedLoaded
  spaceId: Ref<string>
  tpData: TpData
  currentIdx: number
}