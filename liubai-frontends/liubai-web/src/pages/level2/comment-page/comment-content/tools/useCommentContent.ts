import { ref, watch, onActivated, onDeactivated } from "vue"
import type { CcCtx } from "./types"
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import type { RouteLocationNormalizedLoaded } from "vue-router";

export function useCommentContent() {
  const commentId = ref("")
  const { route } = useRouteAndLiuRouter()
  const ctx: CcCtx = {
    commentId,
    route
  }
  listenRouteChange(ctx)

  return {
    commentId,
  }

}


function listenRouteChange(
  ctx: CcCtx,
) {

  let activated = true

  const toCheck = (r: RouteLocationNormalizedLoaded) => {
    const { name, params } = r
    if(name !== "comment") return
    const id = params.commentId
    if(typeof id === "string") {
      ctx.commentId.value = id
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