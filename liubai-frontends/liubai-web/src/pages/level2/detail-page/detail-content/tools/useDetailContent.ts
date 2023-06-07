import { onActivated, onDeactivated, ref, watch } from "vue"
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { DcCtx } from "./types";
import type { ThreadShow } from "~/types/types-content";
import middleBridge from "~/utils/middle-bridge";

export function useDetailContent() {

  let threadId = ref("")
  const { route } = useRouteAndLiuRouter()

  const ctx: DcCtx = {
    threadId,
    route
  }
  listenRouteChange(ctx)

  // 接收来自 thread-detail 返回的 threadShow
  const onGetThreadShow = (thread: ThreadShow) => {
    const val = thread.title
    middleBridge.setAppTitle(val)
  }

  return {
    threadId,
    onGetThreadShow,
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