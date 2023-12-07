import { type RouteAndLiuRouter } from "~/routes/liu-router"
import localCache from "~/utils/system/local-cache";

export function redirectToLoginPage(
  rr: RouteAndLiuRouter,
) {
  const n = rr.route.name
  if(n === "login") return
  rr.router.replace({ name: "login" })
}

export function getClientKey() {
  const onceData = localCache.getOnceData()
  const { client_key, enc_client_key } = onceData
  if(!client_key || !enc_client_key) {
    console.warn("client_key 或 enc_client_key 不存在")
    console.log(" ")
    return {}
  }
  return { client_key, enc_client_key }
}
