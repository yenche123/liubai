import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { ref, watch } from "vue"
import type { Ref } from "vue"
import type { RouteLocationNormalizedLoaded } from "vue-router"

export function useEditContent() {
  const threadId = ref("")
  const { route } = useRouteAndLiuRouter()
  watch(() => route, (newV) => {
    whenRouteChange(threadId, newV)
  })
  whenRouteChange(threadId, route)

  return {
    threadId,
  }
}

function whenRouteChange(
  threadId: Ref<string>,
  route: RouteLocationNormalizedLoaded,
) {
  const { name, params } = route
  if(name !== "edit") return
  const { contentId } = params
  if(contentId && typeof contentId === "string") {
    threadId.value = contentId
  }
}

