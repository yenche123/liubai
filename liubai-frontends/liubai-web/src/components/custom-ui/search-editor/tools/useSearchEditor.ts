import { provide, reactive, ref, toRef, watch } from "vue";
import type { 
  SearchEditorData,
  SearchEditorParam,
  SearchEditorRes,
  SeResolver,
  SearchFuncs,
  SearchListType,
  ThirdPartyType,
} from "./types"
import { searchFuncsKey } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import typeCheck from "~/utils/basic/type-check";
import valTool from "~/utils/basic/val-tool";
import time from "~/utils/basic/time";
import searchController from "~/utils/controllers/search-controller";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import liuUtil from "~/utils/liu-util";
import { useSeKeyboard } from "./useSeKeyboard";
import sideBar from "~/views/side-bar";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import { 
  toListenKeyboard, 
  cancelListenKeyboard,
} from "../../tools/listen-keyboard"

const TRANSITION_DURATION = 150
const enable = ref(false)
const show = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
const seData = reactive<SearchEditorData>({
  reloadNum: 0,
  mode: "search",
  inputTxt: "",
  nativeInputTxt: "",
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
  initProvideData()
  listenRouteChange()
  listenInputChange()

  let opt = {
    whenOpen: showSearchEditor,
    seData,
    tranMs: TRANSITION_DURATION,
    show
  }
  useSeKeyboard(opt)

  const onInput = (e: Event) => {
    //@ts-expect-error
    seData.nativeInputTxt = e.target.value
  }

  return {
    TRANSITION_DURATION,
    inputEl,
    enable,
    show,
    seData,
    onTapMask,
    onTapClearInput,
    onInput,
  }
}


export function showSearchEditor(param: SearchEditorParam) {
  let initTxt = param.initText ?? ""
  seData.mode = param.type
  if(initTxt || param.type === "select_thread") {
    setInputTxt(initTxt)
    seData.innerList = []
  }
  seData.excludeThreads = param.excludeThreads ?? []
  seData.reloadNum++

  openIt()

  const _wait = (a: SeResolver): void => {
    _resolve = a
  }
  return new Promise(_wait)
}


// 传递事件给子组件，供其调用
function initProvideData() {
  const provideData: SearchFuncs = {
    tapitem: onTapItem,
    mouseenteritem: onMouseEnter,
    clearitem: onTapClearItem,
  }
  provide(searchFuncsKey, provideData)
}

async function onTapItem(listType: SearchListType, atomId: string) {
  if(seData.indicator !== atomId) {
    seData.indicator = atomId
    await valTool.waitMilli(90)
  }
  toConfirm()
}

function onMouseEnter(newIndicator: string) {
  seData.indicator = newIndicator
}

// 清除某个最近搜索的记录
async function onTapClearItem(listType: SearchListType, atomId: string) {
  if(listType !== "recent") return
  let idx = -1
  let txt = ""
  seData.recentList.forEach((v, i) => {
    if(v.atomId === atomId) {
      idx = i
      txt = v.title
    }
  })
  if(idx < 0 || !txt) return
  await searchController.deleteKeyword(txt)
  seData.recentList.splice(idx, 1)
}


function listenRouteChange() {
  rr = useRouteAndLiuRouter()
  watch(rr.route, (newV) => {
    const { query, meta } = newV
    if(!query) return
    if(meta.inApp === false) return

    const { q, search } = query
    if(search === "01" || q) {
      if(q && typeCheck.isString(q) && q !== seData.inputTxt) {
        setInputTxt(q)
      }
      if(seData.reloadNum < 1) seData.reloadNum = 1
      _toOpen()
      return
    }

    if(_resolve) {
      if(inputEl.value) inputEl.value.blur()
      toResolve({ action: "cancel" })
    }

    _toClose()
  }, { immediate: true })
}

function listenInputChange() {
  const wStore = useWorkspaceStore()
  const { spaceId } = storeToRefs(wStore)
  const inputTxt = toRef(seData, "inputTxt")
  const reloadNum = toRef(seData, "reloadNum")
  const DURATION = 150
  let lastSearchStamp = 0
  let timeout: LiuTimeout

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
    const list2 = searchController.searchRecent(opt1)
    seData.recentList = list2

    // 3. 设置当前的 indicator
    toSetIndicator()
  }

  const toSearch = async () => {
    let text = seData.trimTxt
    if(!text) return

    // 1. 先弹出 third 列表
    let opt1 = {
      text,
      mode: seData.mode,
      excludeThreads: seData.excludeThreads,
    }
    seData.thirdList = searchController.searchThird(opt1)

    // 2. 搜索结果
    console.time("searchInner")
    const list = await searchController.searchInner(opt1)
    console.timeEnd("searchInner")
    seData.innerList = list

    // 3. 设置当前的 indicator
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
      timeout = undefined
      lastSearchStamp = time.getTime()
      toSearch()
    }, DURATION - diff)
  }

  watch([reloadNum, spaceId, inputTxt], (
    [newV1, newV2, newV3]
  ) => {
    if(!newV1 || !newV2) return
    whenInputChange(newV3)
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
  await valTool.waitMilli(TRANSITION_DURATION)

  toListenKeyboard({ 
    whenKeyUp, 
    data: seData,
  })

  if(!inputEl.value) return
  inputEl.value.focus()
}

async function _toClose() {
  if(!enable.value) return
  show.value = false

  cancelListenKeyboard()

  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}

function whenKeyUp(e: KeyboardEvent) {
  const k = e.key
  if(k === "Enter") {
    toConfirm()
  }
  else if(k === "Escape") {
    toCancel()
  }
}


function toCancel() {
  if(inputEl.value) inputEl.value.blur()
  toResolve({ action: "cancel" })
  closeIt()
}

function toConfirm() {
  let res = getConfirmRes()
  if(!res) return

  let hasClosed = false
  if(seData.mode === "search") {
    hasClosed = toRedirectAndSave(res)
    searchController.addKeywordToRecent(seData.trimTxt)
  }

  if(inputEl.value) inputEl.value.blur()
  toResolve(res)
  if(!hasClosed) closeIt()
  sideBar.closeFixedSideBar()
}

function toRedirectAndSave(res: SearchEditorRes) {
  let hasClosed = false
  if(!rr) return hasClosed
  const text = seData.trimTxt
  const a = res.atomId as ThirdPartyType
  
  let opt = { rr, replace: true }

  if(a === "bing") {
    let res = liuUtil.open.openBing(text, opt)
    if(res === "inner") hasClosed = true
  }
  else if(a === "xhs") {
    let res = liuUtil.open.openXhs(text, opt)
    if(res === "inner") hasClosed = true
  }
  else if(a === "github") {
    let res = liuUtil.open.openGithub(text, opt)
    if(res === "inner") hasClosed = true
  }
  else if(res.commentId && res.threadId) {
    hasClosed = true
    liuUtil.open.openComment(res.commentId, opt)
  }
  else if(res.threadId) {
    hasClosed = true
    liuUtil.open.openDetail(res.threadId, opt)
  }
  return hasClosed
}

function getConfirmRes() {
  let res: SearchEditorRes = {
    action: "confirm",
  }
  let { indicator } = seData
  let hasTxt = Boolean(seData.trimTxt)

  if(hasTxt) {
    let tmp1 = seData.innerList.find(v => v.atomId === indicator)
    if(tmp1) {
      res.commentId = tmp1.commentId
      res.threadId = tmp1.threadId
      return res
    }
    let tmp2 = seData.thirdList.find(v => v.atomId === indicator)
    if(tmp2) {
      res.atomId = tmp2.atomId
      return res
    }
  }
  else {
    let tmp3 = seData.suggestList.find(v => v.atomId === indicator)
    if(tmp3) {
      res.commentId = tmp3.commentId
      res.threadId = tmp3.threadId
      return res
    }
    let tmp4 = seData.recentList.find(v => v.atomId === indicator)
    if(tmp4) {
      setInputTxt(tmp4.title)
      return null
    }
  }

  return res
}

function onTapMask() {
  toCancel()
}

async function onTapClearInput() {
  setInputTxt("")
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
  const list2 = searchController.searchRecent(opt1)
  seData.recentList = list2

  // 3. 设置当前的 indicator
  toSetIndicator()

  if(!inputEl.value) return
  inputEl.value.focus()
}

function setInputTxt(text: string) {
  seData.inputTxt = text
  seData.nativeInputTxt = text
}

