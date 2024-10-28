import { reactive, ref, watch } from "vue"
import valTool from "~/utils/basic/val-tool"
import type { HteData, HteResolver } from "./types"
import type { TagShow } from "~/types/types-content"
import type {
  HashTagEditorParam, 
  HashTagEditorRes, 
} from "~/types/other/types-hashtag"
import { searchLocal } from "~/utils/system/tag-related/search"
import { formatTagText, findTagId, hasStrangeChar } from "~/utils/system/tag-related"
import liuApi from "~/utils/liu-api"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import liuUtil from "~/utils/liu-util"
import { initRecent, getRecent } from "./tag-recent"
import type { SimpleFunc } from "~/utils/basic/type-tool"
import { useKeyboard } from "~/hooks/useKeyboard"
import time from "~/utils/basic/time"
import { toFocusInput } from "../../tools/listen-keyboard"

const hteData = reactive<HteData>({
  enable: false,
  show: false,
  transDuration: 150,
  inputTxt: "",
  nativeInputTxt: "",
  lastOnInputStamp: 0,
  emoji: "",
  errCode: 0,
  newTag: "",
  list: [],
  selectedIndex: -1,
  mode: "",
  recentTagIds: [],
  lastFocusOrBlurStamp: 0,
})

const inputEl = ref<HTMLInputElement | null>(null)
const queryKey = "hashtageditor"
let rr: RouteAndLiuRouter | undefined

let firstInputVal = ""
let firstEmoji = ""

let _resolve: HteResolver | undefined

export function initHashtagEditor() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()
  const { isMobile } = liuApi.getCharacteristic()

  return { 
    inputEl,
    hteData,
    isMobile,
    onTapMask,
    onTapItem,
    onInput,
    onFocus,
    onBlur,
    onEmojiChange,
  }
}

function listenRouteChange() {
  if(!rr) return
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(hteData.mode !== "") _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
      return
    }

    if(_resolve) {
      if(inputEl.value) inputEl.value.blur()
      toResolve({ confirm: false })
    }

    _toClose()
  }, { immediate: true })
}


export function showHashtagEditor(opt: HashTagEditorParam) {
  firstInputVal = opt.text ?? ""
  setInputTxt(firstInputVal)
  firstEmoji = opt.icon ? liuApi.decode_URI_component(opt.icon) : ""
  hteData.emoji = firstEmoji
  hteData.errCode = 0
  hteData.newTag = ""
  hteData.list = []
  hteData.selectedIndex = -1
  hteData.mode = opt.mode

  if(opt.mode === "search") {
    initRecent(hteData)
  }

  openIt(rr, queryKey)

  const _wait = (a: HteResolver): void => {
    _resolve = a
  }
  return new Promise(_wait)
}

function setInputTxt(text: string) {
  hteData.inputTxt = text
  hteData.nativeInputTxt = text
}

function onEmojiChange(newEmoji?: string) {
  hteData.emoji = newEmoji ?? ""
}

function toResolve(res: HashTagEditorRes) {
  if(!_resolve) return
  _resolve(res)
  _resolve = undefined
}

function onBlur() {
  onFocusOrNot()
}

function onFocus() {
  onFocusOrNot()
  const { mode, inputTxt, list } = hteData
  if(mode === "search" && !inputTxt && list.length < 1) {
    getRecent(hteData)
  }
}

function onFocusOrNot() {
  hteData.lastFocusOrBlurStamp = time.getTime()
}

function reset(
  errCode: number
) {
  hteData.errCode = errCode
  hteData.newTag = ""

  if(errCode === 0 && hteData.mode === "search") {
    getRecent(hteData)
  }
  else {
    hteData.list = []
  }
}


function onInput(e: Event) {
  //@ts-ignore
  hteData.nativeInputTxt = e.target.value
  hteData.lastOnInputStamp = time.getLocalTime()
  let val = hteData.inputTxt.trim()

  // 1. the input is "#"
  if(val === "#" || val === "＃") {
    hteData.inputTxt = ""
    hteData.nativeInputTxt = ""
    reset(0)
    return
  }

  // 2. the input is empty
  if(!val) {
    reset(0)
    return
  }

  // 3. the input contains strange char
  const res1 = hasStrangeChar(val)
  if(res1) {
    reset(1)
    return
  }
  hteData.errCode = 0

  // 4. return if the mode is `edit` mode
  const { mode } = hteData
  if(mode === "edit") return

  // 5. format the input
  val = formatTagText(val)
  const newTag = val.split("/").join(" / ")

  // 6. set newTag if the mode is `add`
  if(mode === "add") {
    hteData.newTag = newTag
    return
  }

  // 7. search local
  const res2 = searchLocal(val)
  let tagExisted = false
  res2.forEach(v => {
    if(v.text === newTag) tagExisted = true
  })

  hteData.list = res2
  hteData.newTag = tagExisted ? "" : newTag
  
  if(hteData.selectedIndex >= res2.length) {
    hteData.selectedIndex = res2.length - 1
  }
}

function onTapMask() {
  if(time.isWithinMillis(hteData.lastFocusOrBlurStamp, 300)) {
    return
  }

  // 如果当前是编辑模式，考虑到 emoji 改版的情况
  if(hteData.mode === "edit" && firstEmoji !== hteData.emoji) {
    onTapConfirm()
    return
  }
  
  toCancel()
}

function toCancel() {
  if(inputEl.value) inputEl.value.blur()
  toResolve({ confirm: false })
  closeIt(rr, queryKey)
}

function onTapConfirm() {
  const res1 = checkState()
  if(res1) {
    toEnter()
  }
}

function onTapItem(index: number) {
  if(hteData.selectedIndex !== index) hteData.selectedIndex = index
  toEnter()
}

function toEnter() {
  if(inputEl.value) inputEl.value.blur()

  const m = hteData.mode
  if(m === "edit" || m === "add") {
    toRenameOrAdd()
  }
  else if(m === "search") {
    toSelect()
  }
}

function toRenameOrAdd() {
  const text = formatTagText(hteData.inputTxt)
  const tagId = findTagId(text)
  const icon = hteData.emoji ? liuApi.encode_URI_component(hteData.emoji) : undefined
  const res: HashTagEditorRes = {
    confirm: true,
    text,
    tagId: tagId ? tagId : undefined,
    icon,
  }
  toResolve(res)
  closeIt(rr, queryKey)
}

function toSelect() {
  const idx = hteData.selectedIndex
  const item = idx >= 0 ? hteData.list[idx] : undefined
  if(idx >= 0 && !item) {
    console.log("选择的选项，却没有任何东西")
    return
  }

  let text = idx < 0 ? hteData.newTag : (item as TagShow).text
  text = formatTagText(text)
  const tagId = findTagId(text)
  const _emoji = idx < 0 ? undefined : (item as TagShow).emoji
  const icon = _emoji ? liuApi.encode_URI_component(_emoji) : undefined
  const res: HashTagEditorRes = {
    confirm: true,
    text,
    tagId: tagId ? tagId : undefined,
    icon,
  }
  toResolve(res)
  closeIt(rr, queryKey)
}

function checkState() {

  const m = hteData.mode
  if(m === "search") {
    const sIdx = hteData.selectedIndex
    if(hteData.newTag && sIdx === -1) return true
    const item = hteData.list[sIdx]
    if(item) return true
    return false
  }
  
  if(m === "edit" || m === "add") {
    if(firstInputVal === hteData.inputTxt && firstEmoji === hteData.emoji) {
      return false
    }

    const inputValFormatted = formatTagText(hteData.inputTxt)
    if(!inputValFormatted) {
      return false
    }
    if(hteData.errCode > 0) {
      return false
    }
  }

  return true
}

async function _toOpen() {
  if(hteData.show) return

  toFocusInput(inputEl)

  hteData.enable = true
  await liuUtil.waitAFrame()
  hteData.show = true
  toListenKeyboard()
  await valTool.waitMilli(hteData.transDuration)
}

async function _toClose() {
  if(!hteData.enable) return
  hteData.show = false
  await valTool.waitMilli(hteData.transDuration)
  hteData.enable = false
  cancelListenKeyboard()
}


let stopListenToKeyboard: SimpleFunc | undefined
function toListenKeyboard() {
  
  // 监听键盘敲击 上、下 的逻辑
  const whenKeyDown = (e: KeyboardEvent) => {
    const key = e.key
    if(key !== "ArrowDown" && key !== "ArrowUp") return
    const len = hteData.list.length
    if(len < 1) return
  
    e.preventDefault()
  
    if(!liuUtil.canKeyUpDown()) return
    
    let diff = key === "ArrowDown" ? 1 : -1
    let tmpIdx = hteData.selectedIndex + diff
    if(tmpIdx >= len) tmpIdx = -1
    else if(tmpIdx < -1) tmpIdx = len - 1
    hteData.selectedIndex = tmpIdx
  }

  // 监听键盘敲击 Enter、Escape 的逻辑
  const whenKeyUp = (e: KeyboardEvent) => {
    const key = e.key
    if(key === "Escape") {
      toCancel()
    }
    else if(key === "Enter") {
      onTapConfirm()
    }
  }

  let res = useKeyboard({
    data: hteData,
    whenKeyDown,
    whenKeyUp,
    setup: false,
  })
  stopListenToKeyboard = res.stop
}

function cancelListenKeyboard() {
  stopListenToKeyboard?.()
}

