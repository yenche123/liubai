import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { ref, watch } from "vue"
import type { Ref } from "vue"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { PageState } from "~/types/types-atom";

export function useEditContent() {
  const threadId = ref("")
  const state = ref<PageState>(0)
  const { route } = useRouteAndLiuRouter()
  watch(route, (newV) => {
    whenRouteChange(threadId, state, newV)
  })
  whenRouteChange(threadId, state, route)

  const onNodata = () => {
    state.value = 50
  }
  const onHasdata = () => {
    state.value = -1
  }

  return {
    threadId,
    state,
    onNodata,
    onHasdata,
  }
}

function whenRouteChange(
  threadId: Ref<string>,
  state: Ref<PageState>,
  route: RouteLocationNormalizedLoaded,
) {
  const { name, params } = route
  if(name !== "edit") return
  const { contentId } = params
  if(!contentId || typeof contentId !== "string") return
  if(threadId.value === contentId) return
  state.value = 0
  threadId.value = contentId
}

