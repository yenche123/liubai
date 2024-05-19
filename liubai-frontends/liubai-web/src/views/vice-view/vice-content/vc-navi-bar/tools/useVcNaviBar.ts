import { reactive, watch } from "vue"
import type { VnbData } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import valTool from "~/utils/basic/val-tool"

export function useVcNaviBar() {

  const data: VnbData = reactive({
    showCloseBtn: true,  
  })

  const rr = useRouteAndLiuRouter()
  watch(rr.route, (newV) => {
    const q = newV.query
    const { vlink, vfile } = q

    if(valTool.isStringWithVal(vlink)) {
      data.showCloseBtn = true
      return
    }
    if(valTool.isStringWithVal(vfile)) {
      data.showCloseBtn = true
      return
    }

    let showCloseBtn = true
    const stacks = rr.router.getStack()
    const len = stacks.length
    if(len <= 2) showCloseBtn = false
    data.showCloseBtn = showCloseBtn
  })

  return {
    vnbData: data
  }
}