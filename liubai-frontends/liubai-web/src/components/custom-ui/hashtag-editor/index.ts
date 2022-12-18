import { ref } from "vue"
import valTool from "../../../utils/basic/val-tool"
import type {
  HteResolver,
  TagItem
} from "./tools/types"
import type {
  HteMode,
  HashTagEditorParam, 
  HashTagEditorRes, 
} from "../../../types/other/types-hashtag"
import { searchLocal } from "./tools/handle"
import { formatTagText, findTagId } from "../../../utils/system/workspace"
import time from "../../../utils/basic/time"

// 使用 element.scrollIntoView 让元素露出来 

const TRANSITION_DURATION = 150
const enable = ref(false)
const show = ref(false)

const inputEl = ref<HTMLInputElement | null>(null)
const inputVal = ref("")    // 输入框里的文字
const emoji = ref("")       // 输入框左侧的 emoji
const errCode = ref(0)      // 错误提示. 1: 不得输入奇怪的字符; 2: 最多若干个 "/"
const newTag = ref("")      // 可以被创建的标签，注意该文字不能回传到业务侧，因为它的结构为 "xxx / yyy / zzz"
const list = ref<TagItem[]>([])
const selectedIndex = ref(-1)        // 被选择的 index
const mode = ref<HteMode>("edit")

let _resolve: HteResolver | undefined

export function initHtePicker() {

  return { 
    inputEl,
    enable, 
    show,
    TRANSITION_DURATION,
    inputVal,
    emoji,
    errCode,
    newTag,
    list,
    selectedIndex,
    mode,
    onTapCancel,
    onTapConfirm,
    onTapItem,
    onInput,
  }
}


export async function showHashTagEditor(opt: HashTagEditorParam) {
  inputVal.value = opt.text ?? ""
  emoji.value = opt.icon ? decodeURIComponent(opt.icon) : ""
  errCode.value = 0
  newTag.value = ""
  list.value = []
  selectedIndex.value = -1
  mode.value = opt.mode

  await _open()

  const _wait = (a: HteResolver): void => {
    _resolve = a
  }
  return new Promise(_wait)
}

function onInput() {
  let val = inputVal.value.trim()
  if(!val) {
    errCode.value = 0
    newTag.value = ""
    list.value = []
    return
  }
  const res1 = hasStrangeChar(val)
  if(res1) {
    errCode.value = 1
    newTag.value = ""
    return
  }
  errCode.value = 0

  if(mode.value === "edit") return

  val = formatTagText(val)
  const res2 = searchLocal(val)
  list.value = res2
  newTag.value = val.split("/").join(" / ")
  if(selectedIndex.value >= res2.length) {
    selectedIndex.value = res2.length - 1
  }
}

function hasStrangeChar(val: string) {
  const strange_char = "~@#$%^*'\"{}\\"
  for(let i=0; i<val.length; i++) {
    const v = val[i]
    const res = strange_char.includes(v)
    if(res) return true
  }
  return false
}


function onTapCancel() {
  if(inputEl.value) inputEl.value.blur()
  _resolve && _resolve({ confirm: false })
  _close()
}

function onTapConfirm() {
  if(!checkState()) {
    onTapCancel()
    return
  }

  toEnter()
}

function onTapItem(index: number) {
  if(selectedIndex.value !== index) selectedIndex.value = index
  toEnter()
}

function toEnter() {
  if(inputEl.value) inputEl.value.blur()

  const m = mode.value
  if(m === "edit") {
    toRename()
  }
  else if(m === "search") {
    toSelect()
  }
}

function toRename() {
  const text = formatTagText(inputVal.value)
  const tagId = findTagId(text)
  const icon = emoji.value ? encodeURIComponent(emoji.value) : undefined
  const res: HashTagEditorRes = {
    confirm: true,
    text,
    tagId: tagId ? tagId : undefined,
    icon,
  }
  _resolve && _resolve(res)
  _close()
}

function toSelect() {
  const idx = selectedIndex.value
  const item = idx >= 0 ? list.value[idx] : undefined
  if(idx >= 0 && !item) {
    console.log("选择的选项，却没有任何东西")
    return
  }

  let text = idx < 0 ? newTag.value : (item as TagItem).textBlank
  text = formatTagText(text)
  const tagId = findTagId(text)
  const _emoji = idx < 0 ? undefined : (item as TagItem).emoji
  const icon = _emoji ? encodeURIComponent(_emoji) : undefined
  const res: HashTagEditorRes = {
    confirm: true,
    text,
    tagId: tagId ? tagId : undefined,
    icon,
  }
  _resolve && _resolve(res)
  _close()
}

// 检测 onTapConfirm
function checkState() {
  
  const m = mode.value
  if(m === "search") {
    const sIdx = selectedIndex.value
    if(newTag.value && sIdx === -1) return true
    const item = list.value[sIdx]
    if(item) return true
    return false
  }
  
  if(m === "edit") {
    const inputValFormatted = formatTagText(inputVal.value)
    if(!inputValFormatted) {
      return false
    }
    if(errCode.value > 0) {
      return false
    }
  }

  return true
}


async function _open() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
  _toListenKeyUp()
  await valTool.waitMilli(TRANSITION_DURATION)
  if(!inputEl.value) return
  inputEl.value.focus()
}

async function _close() {
  if(!show.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
  _cancelListenKeyUp()
}


/*********** 监听键盘敲击 上、下 的逻辑 ***********/
function _whenKeyDown(e: KeyboardEvent) {
  const key = e.key
  if(key !== "ArrowDown" && key !== "ArrowUp") return
  const len = list.value.length
  if(len < 1) return

  e.preventDefault()

  if(!canKeyUpDown()) return
  
  let diff = key === "ArrowDown" ? 1 : -1
  let tmpIdx = selectedIndex.value + diff
  if(tmpIdx >= len) tmpIdx = -1
  else if(tmpIdx < -1) tmpIdx = len - 1
  selectedIndex.value = tmpIdx
}

/*********** 监听键盘敲击 Enter、Escape 的逻辑 ***********/
function _whenKeyUp(e: KeyboardEvent) {
  const key = e.key
  if(key === "Escape") {
    onTapCancel()
    return
  }
  if(key === "Enter") {
    onTapConfirm()
    return
  }
}


let lastKeyUpDown = 0
function canKeyUpDown() {
  const now = time.getTime()
  const diff = now - lastKeyUpDown
  if(diff < 20) return false
  lastKeyUpDown = now
  return true
}


function _toListenKeyUp() {
  window.addEventListener("keydown", _whenKeyDown)
  window.addEventListener("keyup", _whenKeyUp)
}

function _cancelListenKeyUp() {
  window.removeEventListener("keydown", _whenKeyDown)
  window.removeEventListener("keyup", _whenKeyUp)
}

