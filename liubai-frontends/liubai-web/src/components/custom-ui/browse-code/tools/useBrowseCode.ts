import { ensureCustomUi } from "../../tools/lazy-custom-ui"
import { reactive, watch } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import type {
  BcParam,
  BcData,
  BcResolver,
  BcResult,
} from "./types"
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import { toListenEscKeyUp, cancelListenEscKeyUp } from "../../tools/listen-keyup"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import cfg from "~/config"
import liuApi from "~/utils/liu-api"

let _resolve: BcResolver | undefined

const TRANSITION_DURATION = 350
const queryKey = "browsecode"
let rr: RouteAndLiuRouter | undefined

const bcData = reactive<BcData>({
  code: "",
  language: null,
  show: false,
  enable: false,
})

export function initBrowseCode() {
  listenRouteChange()
  return {
    bcData,
    TRANSITION_DURATION,
    onTapClose,
    onTapCopy,
  }
}

function listenRouteChange() {
  rr = useRouteAndLiuRouter()
  watch(rr.route, (newV) => {
    const { query } = newV
    if (!query) return

    if (query[queryKey] === "01") {
      if (bcData.code) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey, () => !bcData.code)
    }
    else {
      _toClose()
    }
  }, { immediate: true })
}

function onTapClose() {
  closeIt(rr, queryKey)
}

function onTapCopy() {
  const txt = bcData.code
  if (!txt) return
  liuApi.copyToClipboard(txt)

  if(bcData.copiedTimeout) {
    clearTimeout(bcData.copiedTimeout)
  }
  bcData.copiedTimeout = setTimeout(() => {
    bcData.copiedTimeout = undefined
  }, 2000)
}

export async function browseCode(param: BcParam) {
  if (!param.code) {
    console.warn("param.code 必须有值")
    return
  }

  bcData.code = param.code
  bcData.language = param.language

  await ensureCustomUi("browse-code")

  openIt(rr, queryKey)

  const _wait = (a: BcResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
}

let toggleTimeout: LiuTimeout
function _toOpen() {
  if (bcData.show) return
  if (toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  bcData.enable = true
  toggleTimeout = setTimeout(() => {
    bcData.show = true
    toListenEscKeyUp(onTapClose)
  }, cfg.frame_duration)
}

function _toClose() {
  if (!bcData.enable) return
  if (toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  bcData.show = false
  toggleTimeout = setTimeout(() => {
    bcData.enable = false
    cancelListenEscKeyUp()
    toResolve({ closed: true })
  }, TRANSITION_DURATION)
}

function toResolve(res: BcResult) {
  if (!_resolve) return
  _resolve(res)
  _resolve = undefined
}
