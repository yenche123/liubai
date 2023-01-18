import type { ThreadShow } from "~/types/types-content"
import type { RouteAndLiuRouter } from "~/routes/liu-router"

export interface PreCtx {
  thread: ThreadShow
  rr: RouteAndLiuRouter
}