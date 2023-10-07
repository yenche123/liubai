import type { PageState } from "~/types/types-atom"
import type { BasicView } from "~/types/types-view"
import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { Ref } from "vue"


// 这里 BasicView.id 即为 stateId
export interface SmpView extends BasicView {
  pState: PageState
  stateText?: string
  stateTextKey?: string
  goToTop: number
  scrollPosition: number
}

export interface SmpData {
  list: SmpView[]
}

export interface SmpCtx {
  route: RouteLocationNormalizedLoaded
  spaceId: Ref<string>
  smpData: SmpData
  currentIdx: number
}