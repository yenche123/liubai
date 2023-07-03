import type { Ref } from "vue"
import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { LiuRouter } from "~/routes/liu-router"

export type VcState = "thread" | "iframe" | ""

export interface VcCtx {
  iframeSrc: Ref<string>
  route: RouteLocationNormalizedLoaded
  router: LiuRouter
  vcState: Ref<VcState>
  cid: Ref<string>
}

export interface VcProps {
  isOutterDraging: boolean
}