import type { Ref } from "vue"
import type { RouteLocationNormalizedLoaded } from "vue-router";

export interface CcCtx {
  commentId: Ref<string>
  route: RouteLocationNormalizedLoaded
}