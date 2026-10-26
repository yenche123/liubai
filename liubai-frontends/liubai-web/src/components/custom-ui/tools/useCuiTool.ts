import type { RouteAndLiuRouter } from "~/routes/liu-router"
import valTool from "~/utils/basic/val-tool"

export async function handleCustomUiQueryErr(
  rr: RouteAndLiuRouter | undefined,
  queryKey: string,
  stillInvalid: () => boolean,
) {
  if(!rr) return
  const fullPath = rr.route.fullPath
  await valTool.waitMilli(200)
  // A valid open or a navigation may have happened while waiting.
  if(rr.route.fullPath !== fullPath || !stillInvalid()) return
  if(!(queryKey in rr.route.query)) return
  const query = { ...rr.route.query }
  delete query[queryKey]
  await rr.router.replace({ path: rr.route.path, query, hash: rr.route.hash })
}

export function openIt(
  rr: RouteAndLiuRouter | undefined,
  queryKey: string,
) {
  if(!rr) return
  const newQ = {
    [queryKey]: "01"
  }
  rr.router.addNewQueryWithOldQuery(rr.route, newQ)
}

export function closeIt(
  rr: RouteAndLiuRouter | undefined,
  queryKey: string,
) {
  if(!rr) return
  rr.router.naviBackUntilNoSpecificQuery(rr.route, queryKey)
}