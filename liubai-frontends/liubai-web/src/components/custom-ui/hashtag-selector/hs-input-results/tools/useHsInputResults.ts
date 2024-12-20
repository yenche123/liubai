import { 
  nextTick, 
  onMounted, 
  reactive, 
  toRef, 
  useTemplateRef, 
  watch,
  type Ref,
} from "vue";
import type { HsirAtom, HsirData, HsirEmit, HsirProps } from "./types";
import { 
  hasStrangeChar, 
  formatTagText,
  getLevelFromText, 
} from "~/utils/system/tag-related";
import { searchLocal } from "~/utils/system/tag-related/search";
import type { TagShow } from "~/types/types-content";
import liuUtil from "~/utils/liu-util";
import { initRecent, getRecent, addRecent } from "./tag-recent";
import liuApi from "~/utils/liu-api";
import { useKeyboard } from "~/hooks/useKeyboard";
import time from "~/utils/basic/time";

let lastInputTxt = ""

export function useHsInputResults(
  props: HsirProps,
  emit: HsirEmit,
  modelValue: Ref<string>,
) {

  const inputEl = useTemplateRef<HTMLInputElement>("inputEl")

  const hsirData = reactive<HsirData>({
    focus: false,
    inputTxt: "",
    nativeInputTxt: "",
    lastOnInputStamp: 0,
    list: [],
    selectedIndex: -1,
    recentTagIds: [],
  })
  watchContext(props, hsirData, modelValue)
  initRecent(hsirData)

  const onFocus = () => {
    hsirData.focus = true
    emit("focusornot", true)

    if(!hsirData.inputTxt && hsirData.list.length < 1) {
      getRecent(props, hsirData)
      return
    }

  }

  const onBlur = () => {
    hsirData.focus = false
    emit("focusornot", false)
  }
  const { onInput } = initOnInput(props, hsirData)
  watchListAdded(props, hsirData)
  toListenKeyboard(hsirData, emit)

  const toFocus = () => {
    const iEl = inputEl.value
    if(!iEl) return
    iEl.focus()
  }
  
  onMounted(() => {
    toFocus()
  })

  const onMouseEnter = (index: number) => {
    hsirData.selectedIndex = index
  }

  const onTapItem = (item: HsirAtom) => {
    toSelect(hsirData, item, emit)
    toFocus()
  }

  return {
    inputEl,
    hsirData,
    onFocus,
    onBlur,
    onInput,
    onMouseEnter,
    onTapItem,
  }
}

function watchContext(
  props: HsirProps,
  hsirData: HsirData,
  modelValue: Ref<string>,
) {
  // 1. handle selectedIndex
  const selectedIndex = toRef(hsirData, "selectedIndex") 
  watch(selectedIndex, async (newV, oldV) => {
    if(newV < 0) return
    await nextTick()
    
    const parent = document.querySelector(".hashtag-selector-container")
    if(!parent) return
    const el = parent.querySelector(".hsirr-item_selected")
    if(!el) return
    
    liuUtil.makeBoxScrollToShowChild(parent, el)
  })

  // 2. bind modelValue and modelValue in both directions
  watch(modelValue, (newV) => {
    if(newV === hsirData.inputTxt) return
    lastInputTxt = newV
    hsirData.inputTxt = newV
    toSearch(props, hsirData, newV)
  })
  const inputTxt = toRef(hsirData, "inputTxt")
  watch(inputTxt, (newV) => {
    if(newV === modelValue.value) return
    modelValue.value = newV
  })
}

function toSelect(
  hsirData: HsirData,
  item: HsirAtom,
  emit: HsirEmit,
) {
  const { added, ...item2 } = item
  emit("tapitem", item2)

  // 还没有被添加，代表即将被添加，那么就写入到最近的 tagIds 中
  if(!added && item2.tagId) {
    addRecent(hsirData, item2.tagId)
  }

  // 若还没被添加，并且输入框的文字与其相同，那么清空输入框
  if(!added && item2.text === hsirData.inputTxt) {
    setInputTxt(hsirData, "")
  }

}

function toListenKeyboard(
  hsirData: HsirData,
  emit: HsirEmit,
) {
  const { isMac } = liuApi.getCharacteristic()
  let lastTryToFinish = 0

  // 监听 Up / Down
  const whenKeyDown = (e: KeyboardEvent) => {
    if(!liuUtil.canKeyUpDown()) return
    const k = e.key
    const ctrlPressed = isMac ? e.metaKey : e.ctrlKey
    if(k === "Enter" && ctrlPressed) {
      lastTryToFinish = time.getTime()
      emit("trytofinish")
      return
    }

    if(k !== "ArrowDown" && k !== "ArrowUp") return
    const length = hsirData.list.length
    if(length < 1) return

    const diff = k === "ArrowDown" ? 1 : -1
    let idx = hsirData.selectedIndex + diff
    if(idx < -1) idx = length - 1
    else if(idx >= length) idx = -1
    hsirData.selectedIndex = idx
  }

  // 监听 Enter
  const whenKeyUp = (e: KeyboardEvent) => {
    const k = e.key
    const ctrlPressed = isMac ? e.metaKey : e.ctrlKey
    if(ctrlPressed) return
    if(k === "Escape") {
      emit("toclose")
      return
    }
    if(k !== "Enter") return
    if(time.isWithinMillis(lastTryToFinish, 300)) return
    
    const idx = hsirData.selectedIndex
    if(idx < 0) return

    const item = hsirData.list[idx]
    if(!item) return
    toSelect(hsirData, item, emit)
  }

  useKeyboard({ whenKeyDown, whenKeyUp, data: hsirData })
}

function watchListAdded(
  props: HsirProps,
  hsirData: HsirData,
) {
  watch(() => props.listAdded, (newV) => {
    const { list } = hsirData
    for(let i=0; i<list.length; i++) {
      const v = list[i]
      const data = newV.find(v2 => {
        if(v2.tagId && v2.tagId === v.tagId) {
          return true
        }
        if(v2.text === v.text) return true
        return false
      })
      v.added = Boolean(data)
    }
  }, { deep: true })
}


function initOnInput(
  props: HsirProps,
  hsirData: HsirData,
) {
  const onInput = (e: Event) => {
    //@ts-ignore
    hsirData.nativeInputTxt = e.target.value
    hsirData.lastOnInputStamp = time.getLocalTime()

    let val = hsirData.inputTxt.trim()
    if(val === lastInputTxt) return
    lastInputTxt = val

    toSearch(props, hsirData, val)
  }

  return { onInput }
}


function toSearch(
  props: HsirProps,
  hsirData: HsirData,
  val: string,
) {
  if(!val) {
    reset(props, hsirData, true)
    return
  }

  const res1 = hasStrangeChar(val)
  if(res1) {
    reset(props, hsirData)
    return
  }

  const val2 = formatTagText(val)

  // 判断层数是否大于 3 
  if(getLevelFromText(val2) > 3) {
    reset(props, hsirData)
    return
  }

  const res2 = searchLocal(val2)
  const text = val2.replace(/\//g, " / ")
  handleAfterSearching(props, hsirData, text, res2)
}


function handleAfterSearching(
  props: HsirProps,
  hsirData: HsirData,
  text: string,
  results: TagShow[]
) {
  const addedList = props.listAdded
  const newList: HsirAtom[] = results.map(v => {
    let data = addedList.find(v1 => {
      if(v1.text === v.text) return true
      if(v1.tagId && v1.tagId === v.tagId) return true
      return false
    })
    const added = Boolean(data)
    return { ...v, added }
  })
  const hasExisted = results.find(v => v.text === text)
  if(!hasExisted) {
    const data2 = addedList.find(v1 => v1.text === text)
    const newData: HsirAtom = {
      tagId: "",
      text,
      added: Boolean(data2),
    }
    newList.splice(0, 0, newData)
  }
  hsirData.list = newList
  if(hsirData.selectedIndex + 1 > newList.length) {
    hsirData.selectedIndex = -1
  }
}



function reset(
  props: HsirProps,
  hsirData: HsirData,
  clearInputTxt: boolean = false,
) {
  if(clearInputTxt) {
    if(hsirData.inputTxt) {
      setInputTxt(hsirData, "")
    }
    getRecent(props, hsirData)
  }
  else {
    hsirData.list = []
  }
  hsirData.selectedIndex = -1
}


function setInputTxt(
  hsirData: HsirData,
  text: string,
) {
  hsirData.inputTxt = text
  hsirData.nativeInputTxt = text
}
