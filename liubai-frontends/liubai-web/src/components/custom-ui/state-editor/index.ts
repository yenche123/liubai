import type {
  SeResolver,
  StateEditorData,
  StateEditorParam
} from "./tools/types"
import { ref, reactive, watch, toRef } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCuiQueryErr } from "../tools/useCuiTool"
import valTool from "~/utils/basic/val-tool"
import liuUtil from "~/utils/liu-util"

let _resolve: SeResolver | undefined

const TRANSITION_DURATION = 150
const enable = ref(false)
const show = ref(false)
const queryKey = "stateeditor"
let rr: RouteAndLiuRouter | undefined

const reData = reactive<StateEditorData>({
  mode: "",
  canSubmit: false,
  text: "",
  showIndex: true,
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
  }
}

export function showStateEditor(param: StateEditorParam) {
  reData.mode = param.mode
  reData.text = param.text ?? ""
  reData.showIndex = param.showIndex ?? true
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
    checkCanSubmuit()
  })
}

function onTapColor(newColor: string) {
  console.log("newColor: ", newColor)
  if(newColor !== reData.color) {
    reData.color = newColor
  }
  else {
    reData.color = ""
  }
  checkCanSubmuit()
} 

function onToggleShowIndex(newV: boolean) {
  reData.showIndex = newV
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
      else handleCuiQueryErr(rr, queryKey)
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