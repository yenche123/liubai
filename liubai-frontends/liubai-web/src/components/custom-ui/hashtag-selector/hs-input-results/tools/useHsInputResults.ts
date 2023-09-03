import { onMounted, reactive, ref, watch } from "vue";
import type { HsirAtom, HsirData, HsirEmit, HsirProps } from "./types";
import { 
  hasStrangeChar, 
  formatTagText, 
} from "~/utils/system/tag-related";
import { searchLocal } from "~/utils/system/tag-related/search";
import type { TagSearchItem } from "~/utils/system/tag-related/tools/types";

export function useHsInputResults(
  props: HsirProps,
  emit: HsirEmit,
) {

  const inputEl = ref<HTMLInputElement>()

  const hsirData = reactive<HsirData>({
    focus: false,
    inputTxt: "",
    list: [],
    selectedIndex: -1,
  })

  const onFocus = () => {
    hsirData.focus = true
    emit("focusornot", true)
  }

  const onBlur = () => {
    hsirData.focus = false
    emit("focusornot", false)
  }
  const { onInput } = initOnInput(props, hsirData)
  watchListAdded(props, hsirData)

  onMounted(() => {
    const iEl = inputEl.value
    if(!iEl) return
    iEl.focus()
  })

  const onMouseEnter = (index: number) => {
    hsirData.selectedIndex = index
  }

  const onTapItem = (item: HsirAtom) => {
    const { added, ...item2 } = item
    emit("tapitem", item2)
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
        if(v2.text === v.textBlank) return true
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
  let lastInputTxt = ""

  const onInput = () => {
    let val = hsirData.inputTxt.trim()
    if(val === lastInputTxt) return
    lastInputTxt = val

    if(!val) {
      reset(hsirData, true)
      return
    }

    const res1 = hasStrangeChar(val)
    if(res1) {
      reset(hsirData)
      return
    }

    const val2 = formatTagText(val)
    const res2 = searchLocal(val)
    const text = val2.replace(/\//g, " / ")
    handleAfterSearching(props, hsirData, text, res2)
  }


  return { onInput }
}



function handleAfterSearching(
  props: HsirProps,
  hsirData: HsirData,
  text: string,
  results: TagSearchItem[]
) {
  const addedList = props.listAdded
  const newList: HsirAtom[] = results.map(v => {
    let data = addedList.find(v1 => {
      if(v1.text === v.textBlank) return true
      if(v1.tagId && v1.tagId === v.tagId) return true
      return false
    })
    const added = Boolean(data)
    return { ...v, added }
  })
  const hasExisted = results.find(v => v.textBlank === text)
  if(!hasExisted) {
    const data2 = addedList.find(v1 => v1.text === text)
    const newData: HsirAtom = {
      tagId: "",
      textBlank: text,
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
  hsirData: HsirData,
  clearInputTxt: boolean = false,
) {
  if(clearInputTxt) {
    if(hsirData.inputTxt) hsirData.inputTxt = ""
  }
  hsirData.list = []
  hsirData.selectedIndex = -1
}
