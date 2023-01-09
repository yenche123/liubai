import type { LiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"

interface TccCtx {
  router: LiuRouter
  route: RouteLocationNormalizedLoaded
  [otherKey: string]: any
}

function openDetailWithViceView(cid: string, ctx: TccCtx) {
  const { route, router } = ctx
  router.pushCurrentWithNewQuery(route, { cid })
}

function openDetailWithDetailPage(contentId: string, ctx: TccCtx) {
  const { route, router } = ctx
  router.pushNewPageWithOldQuery(route, { name: "detail", params: { contentId } })
}

export default {
  openDetailWithViceView,
  openDetailWithDetailPage,
}