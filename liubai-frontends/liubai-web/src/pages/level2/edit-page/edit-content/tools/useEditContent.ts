import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { ref, watch } from "vue"
import type { Ref } from "vue"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { PageState } from "~/types/types-atom";
import { pageStates } from "~/utils/atom"

export function useEditContent() {
  const threadId = ref("")
  const state = ref<PageState>(pageStates.LOADING)
  const { route, router } = useRouteAndLiuRouter()
  watch(route, (newV) => {
    whenRouteChange(threadId, state, newV)
  }, { immediate: true })

  const onNodata = () => {
    state.value = pageStates.NO_DATA
  }
  const onHasdata = () => {
    state.value = pageStates.OK
  }

  const onUpdated = () => {
    router.naviBackUtilNoSpecificName(route)
  }

  return {
    threadId,
    state,
    onNodata,
    onHasdata,
    onUpdated,
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
  state.value = pageStates.LOADING
  threadId.value = contentId
}

