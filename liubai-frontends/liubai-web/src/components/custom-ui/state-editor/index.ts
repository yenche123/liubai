import type {
  SeResolver,
  StateEditorData,
  StateEditorParam,
  StateEditorRes,
} from "./tools/types"
import { ref, reactive, watch, toRef } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCustomUiQueryErr } from "../tools/useCuiTool"
import valTool from "~/utils/basic/val-tool"
import liuUtil from "~/utils/liu-util"
import time from "~/utils/basic/time"

let _resolve: SeResolver | undefined

const TRANSITION_DURATION = 200
const enable = ref(false)
const show = ref(false)
const queryKey = "stateeditor"
let rr: RouteAndLiuRouter | undefined

let lastShowEditorStamp = 0

const reData = reactive<StateEditorData>({
  mode: "",
  canSubmit: false,
  text: "",
  showInIndex: true,
  color: "",
})

export function initStateEditor() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()
  listenText()
  return {
    TRANSITION_DURATION,
    enable,
    show,
    reData,
    onTapColor,
    onToggleShowIndex,
    onTapConfirm,
    onTapCancel,
  }
}

export function showStateEditor(param: StateEditorParam) {
  lastShowEditorStamp = time.getTime()
  reData.mode = param.mode
  reData.text = param.text ?? ""
  reData.showInIndex = param.showInIndex ?? true
  reData.color = param.color ? liuUtil.colorToStorage(param.color) : ""
  reData.canSubmit = false

  openIt(rr, queryKey)

  const _wait = (a: SeResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
}

function listenText() {
  const text = toRef(reData, "text")
  watch(text, () => {
    const diff = time.getTime() - lastShowEditorStamp
    if(diff > TRANSITION_DURATION) {
      checkCanSubmuit()
    }
  })
}

function onTapColor(newColor: string) {
  if(newColor !== reData.color) {
    reData.color = newColor
  }
  else {
    reData.color = ""
  }
  checkCanSubmuit()
}

function onTapConfirm() {
  if(!reData.canSubmit) return
  let obj: StateEditorRes = {
    action: "confirm",
    data: {
      text: reData.text,
      showInIndex: reData.showInIndex,
      color: reData.color,
    }
  }
  _resolve && _resolve(obj)
  closeIt(rr, queryKey)
}

function onTapCancel() {
  _resolve && _resolve({ action: "cancel" })
  closeIt(rr, queryKey)
}


function onToggleShowIndex(newV: boolean) {
  reData.showInIndex = newV
  checkCanSubmuit()
}

function checkCanSubmuit() {
  let oldV = reData.canSubmit
  let newV = false
  
  const trimText = reData.text.trim()
  if(trimText && reData.color) newV = true

  if(oldV !== newV) reData.canSubmit = newV
}

function listenRouteChange() {
  if(!rr) return
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(reData.mode) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
    }
    else {
      _toClose()
    }
  })
}


async function _toOpen() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function _toClose() {
  if(!enable.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}