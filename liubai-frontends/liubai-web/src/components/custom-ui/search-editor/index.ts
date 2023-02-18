import { reactive, ref, toRef, watch } from "vue";
import type { 
  SearchEditorData,
  SearchEditorParam,
  SearchEditorRes,
  SeResolver,
} from "./tools/types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import typeCheck from "~/utils/basic/type-check";
import valTool from "~/utils/basic/val-tool";
import time from "~/utils/basic/time";
import searchController from "~/utils/controllers/search-controller";

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
  listenInputChange()

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
  seData.innerList = []

  openIt()

  const _wait = (a: SeResolver): void => {
    _resolve = a
  }
  return new Promise(_wait)
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

    if(_resolve) {
      if(inputEl.value) inputEl.value.blur()
      toResolve({ action: "cancel" })
    }

    _toClose()
  })
}

function listenInputChange() {
  const inputTxt = toRef(seData, "inputTxt")
  const DURATION = 200
  let lastSearchStamp = 0
  let timeout = 0

  const whenEmpty = async () => {
    seData.trimTxt = ""
    seData.innerList = []

    // 1. 携带 mode 去获取建议
    let opt1 = {
      mode: seData.mode,
      excludeThreads: seData.excludeThreads,
    }
    const list1 = await searchController.searchSuggest(opt1)
    seData.suggestList = list1

    // 2. 携带 mode 去获取最近搜索的关键词

    // 3. 设置当前的 indicator
    toSetIndicator()
  }

  const toSearch = async () => {
    let txt = seData.trimTxt
    if(!txt) return

    seData.thirdList = searchController.searchThird(txt)

    console.log("去查询 innerList........")

    toSetIndicator()
  }

  const whenInputChange = (newV: string) => {
    let txt = newV.trim()
    if(!txt) {
      if(timeout) clearTimeout(timeout)
      whenEmpty()
      return
    }

    seData.trimTxt = txt

    // 去判断何时去 search
    const now = time.getTime()
    const diff = now - lastSearchStamp
    if(diff >= DURATION) {
      lastSearchStamp = now
      toSearch()
      return
    }
    if(timeout) return
    timeout = setTimeout(() => {
      timeout = 0
      lastSearchStamp = time.getTime()
      toSearch()
    }, DURATION - diff)
  }

  watch(inputTxt, (newV) => {
    whenInputChange(newV)
  })
}

function toResolve(res: SearchEditorRes) {
  if(!_resolve) return
  _resolve(res)
  _resolve = undefined
}


function toSetIndicator() {
  let tmp = ""
  let txt = seData.trimTxt
  if(txt) {
    let list1 = seData.innerList
    if(list1.length) {
      tmp = list1[0].atomId
    }
    else {
      let list2 = seData.thirdList
      if(list2.length) {
        tmp = list2[0].atomId
      }
    }
  }
  else {
    let list3 = seData.suggestList
    if(list3.length) {
      tmp = list3[0].atomId
    }
    else {
      let list4 = seData.recentList
      if(list4.length) {
        tmp = list4[0].atomId
      }
    }
  }
  seData.indicator = tmp
}


function openIt() {
  if(!rr) return
  const newQuery = {
    search: "01",
  }
  rr.router.addNewQueryWithOldQuery(rr.route, newQuery)
}

function closeIt() {
  if(!rr) return
  const query = rr.route.query
  const { q } = query
  let key = "search"
  if(q && typeof q === "string") {
    key = "q"
  }
  rr.router.naviBackUntilNoSpecificQuery(rr.route, key)
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

