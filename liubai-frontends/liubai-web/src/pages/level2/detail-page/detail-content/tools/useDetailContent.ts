import { onActivated, onDeactivated, ref, watch } from "vue"
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { DcCtx } from "./types"

export function useDetailContent() {

  let threadId = ref("")
  const { route } = useRouteAndLiuRouter()

  const ctx: DcCtx = {
    threadId,
    route
  }
  listenRouteChange(ctx)

  return {
    threadId,
  }
}

function listenRouteChange(
  ctx: DcCtx,
) {

  let activated = true

  const toCheck = (r: RouteLocationNormalizedLoaded) => {
    const { name, params } = r
    if(name !== "detail") return
    const id = params.contentId
    if(typeof id === "string") {
      ctx.threadId.value = id
    }
  }
  
  watch(ctx.route, (newV) => {
    if(newV && activated) {
      toCheck(newV)
    }
  }, { immediate: true })

  onActivated(() => {
    if(!activated) {
      activated = true
      toCheck(ctx.route)
    }
  })

  onDeactivated(() => activated = false)
}