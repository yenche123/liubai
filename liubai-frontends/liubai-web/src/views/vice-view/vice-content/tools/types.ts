import type { Ref } from "vue"
import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { LiuRouter } from "~/routes/liu-router"

export type VcState = "thread" | "comment" | "iframe" | ""

export interface VcViewAtom {
  state: VcState
  id: string        // thread 时对应 cid，comment 时对应 cid2，iframe 时对应 iframeSrc
  show: boolean
}

export interface VcData {
  list: VcViewAtom[]
  currentState: VcState
  currentId: string
}

export interface VcCtx {
  route: RouteLocationNormalizedLoaded
  router: LiuRouter
  vcData: VcData
}

export interface VcProps {
  isOutterDraging: boolean
}