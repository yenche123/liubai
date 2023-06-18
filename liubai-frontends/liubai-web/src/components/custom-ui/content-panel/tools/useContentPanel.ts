import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import { reactive, ref } from "vue"
import type { ContentPanelData } from "./types"


const TRANSITION_DURATION = 220
const queryKey = "contentpanel"
const cpData = reactive<ContentPanelData>({
  onlyReaction: false,
  enable: false,
  show: false,
})

let rr: RouteAndLiuRouter | undefined

export function initContentPanel() {

  return {
    cpData,
  }
}