import type { Ref } from "vue"
import type { RouteLocationNormalizedLoaded } from "vue-router";

export type VcState = "thread" | "iframe" | ""

export interface VcCtx {
  iframeSrc: Ref<string>
  route: RouteLocationNormalizedLoaded
  vcState: Ref<VcState>
  cid: Ref<string>
}