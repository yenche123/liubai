import { reactive, ref, watch } from "vue"
import valTool from "~/utils/basic/val-tool"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import type {
  PiParam,
  PiReturn,
  PiData,
} from "./tools/types"

type PiResolver = (res: PiReturn) => void

let _resolve: PiResolver | undefined

const TRANSITION_DURATION = 120
const enable = ref(false)
const show = ref(false)
const queryKey = "previewimage"
let rr: RouteAndLiuRouter | undefined

const data = reactive<PiData>({
  imgs: [],
  index: 0,
})

export function initPreviewImage() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()
  return {
    TRANSITION_DURATION,
    enable,
    show,
    data,
    onTapCancel,
  }
}

function listenRouteChange() {
  if(!rr) return
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      _toOpen()
    }
    else {
      _toClose()
    }
  })
}

function onTapCancel() {
  _resolve && _resolve({ hasBack: true })
  _close()
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

  await _open()

  const _wait = (a: PiResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
}

async function _open() {
  if(!rr) return
  const newQ = {
    [queryKey]: "01"
  }
  rr.router.addNewQueryWithOldQuery(rr.route, newQ)
}

async function _toOpen() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function _close() {
  if(!rr) return
  rr.router.naviBackUntilNoSpecificQuery(rr.route, queryKey)
}

async function _toClose() {
  if(!enable.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}