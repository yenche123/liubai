
import type { Ref } from "vue"
import type { RouteLocationNormalizedLoaded } from "vue-router";

export interface DcCtx {
  threadId: Ref<string>
  route: RouteLocationNormalizedLoaded
}