import { reactive, watch } from "vue"
import { useRouteAndLiuRouter } from "../../../../../routes/liu-router"
import type { PageState } from "../../../../../types/types-atom"
import { ThreadShow } from "../../../../../types/types-content"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import threadController from "../../../../../utils/controllers/thread-controller/thread-controller"

export interface DcData {
  state: PageState
  threadShow: ThreadShow | undefined
}

export function useDetailContent() {

  const dcData = reactive<DcData>({
    state: 0,
    threadShow: undefined,
  })

  const { route, router } = useRouteAndLiuRouter()
  watch(route, (newV) => {
    whenRouteChange(newV, dcData)
  })
  whenRouteChange(route, dcData)

  return {
    dcData
  }
}


function whenRouteChange(
  route: RouteLocationNormalizedLoaded,
  dcData: DcData
) {
  if(!route) return

  const { name, params } = route
  if(name !== "detail") return

  const id = params.contentId
  if(!params || typeof id !== "string") return

  loadLocal(id, dcData)
}

/**
 * 本地加载 thread
 */
async function loadLocal(
  id: string,
  dcData: DcData
) {

  const res = await threadController.getData({ id })
  if(res && res.oState === "OK") {
    dcData.state = -1
    dcData.threadShow = res
  }
  else {
    // 这个 else 分支，loadRemote 实现后，必须删掉
    dcData.state = 50
  }

  loadRemote(id, dcData)
}

/**
 * 远端加载 thread
 */
async function loadRemote(
  id: string,
  dcData: DcData
) {
  // 待完善
  
}

