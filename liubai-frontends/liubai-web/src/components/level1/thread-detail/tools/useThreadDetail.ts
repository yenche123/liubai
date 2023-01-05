import { watch, reactive } from "vue";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import threadController from "~/utils/controllers/thread-controller/thread-controller";
import type { TdData, TdProps } from "./types"

export function useThreadDetail(props: TdProps) {

  const tdData = reactive<TdData>({
    state: 0,
    threadShow: undefined,
  })

  const { route } = useRouteAndLiuRouter()
  watch(route, (newV) => {
    whenRouteChange(route, tdData, props)
  })
  whenRouteChange(route, tdData, props)

  return {
    tdData,
  }
}

function whenRouteChange(
  route: RouteLocationNormalizedLoaded,
  tdData: TdData,
  props: TdProps,
) {

  if(!route) return

  const { name, params, query = {} } = route

  const id = params.contentId
  const cid = query.cid

  const location = props.location

  if(location === "detail-page") {
    if(typeof id !== "string" || !id) {
      return
    }
    if(name !== "detail") {
      return
    }
    tdData.state = 0
    loadLocal(id, tdData)
  }
  else if(location === "vice-view") {
    if(typeof cid !== "string" || !cid) {
      return
    }
    tdData.state = 0
    loadLocal(cid, tdData)
  }
}

/**
 * 本地加载 thread
 */
async function loadLocal(
  id: string,
  tdData: TdData
) {
  const res = await threadController.getData({ id })
  if(res && res.oState === "OK") {
    tdData.state = -1
    tdData.threadShow = res
  }
  else {
    // 这个 else 分支，loadRemote 实现后，必须删掉
    tdData.state = 50
  }

  loadRemote(id, tdData)
}

/**
 * 远端加载 thread
 */
async function loadRemote(
  id: string,
  tdData: TdData
) {
  // 待完善
  
}
