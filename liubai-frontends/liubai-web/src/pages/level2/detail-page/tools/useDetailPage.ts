import { reactive, watch } from "vue"
import type { DpData } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import typeCheck from "~/utils/basic/type-check"
import liuUtil from "~/utils/liu-util"

export function useDetailPage() {

  const dpData = reactive<DpData>({
    list: [],
  })

  listenRouteChange(dpData)

  return {
    dpData
  }
}

function listenRouteChange(
  dpData: DpData,
) {
  const rr = useRouteAndLiuRouter()
  const { list } = dpData

  const toCheck = (r: RouteLocationNormalizedLoaded) => {
    const { name, params } = r
    if(name !== "detail") return
    const id = params.contentId
    if(!typeCheck.isString(id)) return

    const newView = { show: true, id }
    liuUtil.view.showView(list, newView)
  }

  watch(rr.route, (newV) => {
    if(newV) toCheck(newV)
  }, { immediate: true })
}