import { nextTick, reactive, ref, watch } from "vue"
import valTool from "~/utils/basic/val-tool"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import type {
  PiParam,
  PiData,
  PiResolver,
  PreviewImageRes,
  ViewTransitionResolver,
} from "./tools/types"
import { openIt, closeIt, handleCustomUiQueryErr } from "../tools/useCuiTool"
import { toListenEscKeyUp, cancelListenEscKeyUp } from "../tools/listen-keyup"
import { transitionHelper } from "~/utils/other/transition-related"
import { getSpecificCSSRule } from "~/utils/other/css-related"
import { Swiper } from "swiper"

let _resolve: PiResolver | undefined
let _viewTranResolve: ViewTransitionResolver | undefined

const TRANSITION_DURATION = 120
const enable = ref(false)
const show = ref(false)
const queryKey = "previewimage"
let rr: RouteAndLiuRouter | undefined
let mSwiper: Swiper | undefined

const data = reactive<PiData>({
  imgs: [],
  index: 0,
})

export function initPreviewImage() {
  listenRouteChange()
  return {
    TRANSITION_DURATION,
    enable,
    show,
    data,
    toCancel,
    onPiSwiper,
  }
}

function listenRouteChange() {
  rr = useRouteAndLiuRouter()
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(data.imgs.length) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
    }
    else {
      _toClose()
    }
  }, { immediate: true })
}

function toCancel() {
  closeIt(rr, queryKey)
}

export async function previewImage(opt: PiParam) {
  const imgs = opt.imgs
  if(!imgs.length) {
    console.warn("opt.urls 必须有值")
    return
  }

  const idx = opt.index ?? 0
  if(idx < 0 || idx >= imgs.length) {
    console.warn("opt.index 不在合法值内")
    return
  }

  data.imgs = imgs
  data.index = idx
  data.viewTransition = opt.viewTransition
  data.viewTransitionCallbackWhileShowing = opt.viewTransitionCallbackWhileShowing
  data.viewTransitionCallbackWhileClosing = opt.viewTransitionCallbackWhileClosing
  initViewTransition(opt.viewTransitionBorderRadius ?? "0px")

  openIt(rr, queryKey)

  const _wait = (a: PiResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
}


function initViewTransition(viewTransitionBorderRadius: string) {
  if(!data.viewTransition) return
  const s = ".liu-close-preview-image::view-transition-old(preview-image)"
  const rule = getSpecificCSSRule(s)
  if(!rule) return
  rule.style.borderRadius = viewTransitionBorderRadius
}

async function onPiSwiper(swiper: Swiper) {
  mSwiper = swiper
  await nextTick()
  _viewTranResolve && _viewTranResolve(true)
  _viewTranResolve = undefined
}

async function _toOpen() {
  if(show.value) return

  if(data.viewTransition) {
    _openByViewTransition()
    return
  }

  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
  toListenEscKeyUp(toCancel)
}

function _openByViewTransition() {
  const updateDOM = () => {
    if(data.viewTransitionCallbackWhileShowing) {
      data.viewTransitionCallbackWhileShowing()
    }
    const _wait = (a: ViewTransitionResolver) => {
      _viewTranResolve = a
      enable.value = true
      show.value = true
    }
    return new Promise(_wait)
  }

  const transition = transitionHelper({
    updateDOM,
    classNames: "liu-previewing-image liu-show-preview-image"
  })

  transition.ready.then(() => {
    // console.log("transition ready...............")
    // console.time("transition-finished")
  })

  transition.finished.then(() => {
    // console.timeEnd("transition-finished")
    toListenEscKeyUp(toCancel)
  })
}


async function _toClose() {
  if(!enable.value) return

  if(data.viewTransition) {
    _closeByViewTransition()
    return
  }

  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
  cancelListenEscKeyUp()
  toResolve({ hasBack: true })
}

async function _closeByViewTransition() {
  let closingIdx = data.index
  if(mSwiper) {
    closingIdx = mSwiper.activeIndex
  }
  data.index = closingIdx
  await nextTick()

  const updateDOM = async () => {
    if(data.viewTransitionCallbackWhileClosing) {
      data.viewTransitionCallbackWhileClosing(closingIdx)
    }
    show.value = false
    enable.value = false
    cancelListenEscKeyUp()
  }
  const transition = transitionHelper({
    updateDOM,
    classNames: "liu-previewing-image liu-close-preview-image"
  })

  transition.finished.then(() => {
    toResolve({ hasBack: true })
  })
}

function toResolve(res: PreviewImageRes) {
  if(!_resolve) return
  _resolve(res)
  _resolve = undefined
  mSwiper = undefined
}
