import { 
  useRouteAndLiuRouter, 
  onBeforeRouteLeave,
} from "~/routes/liu-router";
import { onActivated, ref, watch, type Ref } from "vue"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { PageState } from "~/types/types-atom";
import { pageStates } from "~/utils/atom";
import cui from "~/components/custom-ui";
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import valTool from "~/utils/basic/val-tool";
import liuUtil from "~/utils/liu-util";

export function useEditContent() {
  const threadId = ref("")
  const state = ref<PageState>(pageStates.LOADING)

  const editorChanged = ref(false)
  const alwaysAllowBack = ref(false)
  const forceUpdateNum = ref(0)
  onActivated(() => {
    editorChanged.value = false
    alwaysAllowBack.value = false
  })

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
    alwaysAllowBack.value = true
    router.naviBackUtilNoSpecificName(route)
  }

  const onEditing = () => {
    editorChanged.value = true
  }

  // listening to the route when it prepare to leave
  onBeforeRouteLeave((to, from) => {

    if(alwaysAllowBack.value || !editorChanged.value) {
      return true
    }
    if(from.name !== "edit") return true

    cui.showModal({ 
      title_key: "tip.editing_hd",
      content_key: "tip.editing_bd",
      cancel_key: "tip.got_it",
      confirm_key: "common.update",
      success(res) {
        alwaysAllowBack.value = true
        if(res.confirm) {
          forceUpdateNum.value += 1
        }
        else {
          router.naviBackUtilNoSpecificName(route)
        }
      }
    })

    return false
  })

  // listening to`tag` changed on this thread
  const tStore = useThreadShowStore()
  tStore.$subscribe((mutation, tState) => {
    const { whyChange, updatedThreadShows } = tState
    
    const theThread = updatedThreadShows.find(v => v._id === threadId.value)
    if(!theThread) return

    if(whyChange === "tag") {
      refresh(threadId, state)
    }
  })

  return {
    threadId,
    state,
    forceUpdateNum,
    onNodata,
    onHasdata,
    onUpdated,
    onEditing,
  }
}

async function refresh(
  threadId: Ref<string>,
  state: Ref<PageState>,
) {
  const id = threadId.value
  state.value = pageStates.LOADING
  threadId.value = ""
  await liuUtil.waitAFrame()
  threadId.value = id
}


function whenRouteChange(
  threadId: Ref<string>,
  state: Ref<PageState>,
  route: RouteLocationNormalizedLoaded,
) {
  const { name, params } = route
  if(name !== "edit") return
  const { contentId } = params
  if(!valTool.isStringWithVal(contentId)) return
  if(threadId.value === contentId) return
  state.value = pageStates.LOADING
  threadId.value = contentId
}

