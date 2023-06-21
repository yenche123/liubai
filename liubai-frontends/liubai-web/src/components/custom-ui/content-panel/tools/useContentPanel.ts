import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import { reactive, watch } from "vue"
import type { 
  ContentPanelData,
  ContentPanelParam,
  ContentPanelResolver,
} from "./types"
import valTool from "~/utils/basic/val-tool"

let _resolve: ContentPanelResolver | undefined
const TRANSITION_DURATION = 250
const queryKey = "contentpanel"
const cpData = reactive<ContentPanelData>({
  onlyReaction: false,
  enable: false,
  show: false,
  emojis: ["❤️", "👌", "👏", "🤣", "🥂", "🔥", "🤔", "☕"],
  isMine: false,
})

let rr: RouteAndLiuRouter | undefined

export function initContentPanel() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()
  return {
    TRANSITION_DURATION,
    cpData,
    onTapCancel,
  }
}

export function showContentPanel(param: ContentPanelParam) {
  if(!param.comment && !param.thread) {
    console.warn("showContentPanel 必须指定 comment 或 thread 中的其一")
    return
  }

  if(param.comment && param.thread) {
    console.warn("showContentPanel 只能指定 comment 或 thread 中的其一")
    return
  }

  if(param.comment) {
    cpData.comment = param.comment
    cpData.onlyReaction = param.onlyReaction ?? false
    cpData.isMine = param.comment.isMine
  }
  if(param.thread) {
    cpData.thread = param.thread
    cpData.onlyReaction = true
    cpData.isMine = param.thread.isMine
  } 
  

  openIt(rr, queryKey)

  const _wait = (a: ContentPanelResolver): void => {
    _resolve = a
  }
  return new Promise(_wait)
}


function listenRouteChange() {
  if(!rr) return
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(_resolve) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
      return
    }

    if(_resolve) {
      toResolve()
    }

    _toClose()
  })
}

function onTapCancel() {
  closeIt(rr, queryKey)
}

function toResolve() {
  if(!_resolve) return
  _resolve(true)
  _resolve = undefined
}

async function _toOpen() {
  if(cpData.show) return
  cpData.enable = true
  await valTool.waitMilli(16)
  cpData.show = true
}

async function _toClose() {
  if(!cpData.enable) return
  cpData.show = false
  await valTool.waitMilli(TRANSITION_DURATION)
  cpData.enable = false

}
