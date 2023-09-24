import { onDeactivated, reactive, watch } from "vue"
import type { CpData } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import typeCheck from "~/utils/basic/type-check"
import liuUtil from "~/utils/liu-util"

export function useCommentPage() {

  const cpData = reactive<CpData>({
    list: [],
  })

  listenRouteChange(cpData)

  return { cpData }
}

function listenRouteChange(
  dpData: CpData,
) {
  const rr = useRouteAndLiuRouter()
  const { list } = dpData

  onDeactivated(() => {
    liuUtil.view.closeAllViews(list)
  })

  const toCheck = (r: RouteLocationNormalizedLoaded) => {
    const { name, params } = r
    if(name !== "comment") return
    const id = params.commentId
    if(!typeCheck.isString(id)) return

    const newView = { show: true, id }
    liuUtil.view.showView(list, newView)
  }

  watch(rr.route, (newV) => {
    if(newV) toCheck(newV)
  }, { immediate: true })
}