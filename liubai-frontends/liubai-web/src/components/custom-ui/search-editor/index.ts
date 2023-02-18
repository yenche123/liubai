import { reactive, ref, toRef, watch } from "vue";
import type { 
  SearchEditorData,
  SearchEditorParam,
  SeResolver,
} from "./tools/types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import typeCheck from "~/utils/basic/type-check";
import valTool from "~/utils/basic/val-tool";

const TRANSITION_DURATION = 150
const enable = ref(false)
const show = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
const seData = reactive<SearchEditorData>({
  mode: "search",
  inputTxt: "",
  trimTxt: "",
  excludeThreads: [],
  indicator: "",
  suggestList: [],
  recentList: [],
  thirdList: [],
  innerList: [],
})
let _resolve: SeResolver | undefined
let rr: RouteAndLiuRouter | undefined

export function initSearchEditor() {
  listenRouteChange()

  return {
    TRANSITION_DURATION,
    inputEl,
    enable,
    show,
    seData,
  }
}


export function showSearchEditor(param: SearchEditorParam) {
  let initTxt = param.initText ?? ""
  seData.mode = param.type
  seData.inputTxt = initTxt
  seData.excludeThreads = param.excludeThreads ?? []
  if(!initTxt) seData.trimTxt = ""

  seData.innerList = []


}


function listenRouteChange() {
  rr = useRouteAndLiuRouter()
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    const { q, search } = query
    if(search === "01" || q) {
      if(q && typeCheck.isString(q) && q !== seData.inputTxt) {
        seData.inputTxt = q
      }
      _toOpen()
      return
    }


  })
}

function listenInputChange() {
  const inputTxt = toRef(seData, "inputTxt")

  const whenEmpty = () => {
    seData.trimTxt = ""
    seData.innerList = []

    // 1. 携带 mode 去获取建议

    // 2. 携带 mode 去获取最近搜索的关键词

    // 3. 设置当前的 indicator 
  }

  const whenInputChange = async (newV: string) => {
    if(!newV) {
      whenEmpty()
      return
    }



  }

  watch(inputTxt, (newV) => {
    whenInputChange(newV)
  })
}


function openIt() {

}



async function _toOpen() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
  _toListenKeyUp()
  await valTool.waitMilli(TRANSITION_DURATION)
  if(!inputEl.value) return
  inputEl.value.focus()
}

async function _toClose() {
  if(!enable.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
  _cancelListenKeyUp()
}


function toCancel() {

}


function onTapConfirm() {

}


/*********** 监听键盘敲击 上、下 的逻辑 ***********/
function _whenKeyDown(e: KeyboardEvent) {

}

/*********** 监听键盘敲击 Enter、Escape 的逻辑 ***********/
function _whenKeyUp(e: KeyboardEvent) {
  const key = e.key
  if(key === "Escape") {
    toCancel()
    return
  }
  if(key === "Enter") {
    onTapConfirm()
    return
  }
}


function _toListenKeyUp() {
  window.addEventListener("keydown", _whenKeyDown)
  window.addEventListener("keyup", _whenKeyUp)
}

function _cancelListenKeyUp() {
  window.removeEventListener("keydown", _whenKeyDown)
  window.removeEventListener("keyup", _whenKeyUp)
}

