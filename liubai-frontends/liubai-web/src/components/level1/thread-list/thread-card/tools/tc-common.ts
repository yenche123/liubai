import type { RouteAndLiuRouter } from "~/routes/liu-router"

interface TccCtx {
  rr: RouteAndLiuRouter
  [otherKey: string]: any
}

function openDetailWithViceView(cid: string, ctx: TccCtx) {
  const { route, router } = ctx.rr
  router.pushCurrentWithNewQuery(route, { cid })
}

function openDetailWithDetailPage(contentId: string, ctx: TccCtx) {
  const { route, router } = ctx.rr
  router.pushNewPageWithOldQuery(route, { name: "detail", params: { contentId } })
}

export default {
  openDetailWithViceView,
  openDetailWithDetailPage,
}