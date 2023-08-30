import { onMounted, reactive, ref } from "vue";
import type { HsirData, HsirEmit } from "./types";
import { 
  hasStrangeChar, 
  formatTagText, 
} from "~/utils/system/tag-related";
import { searchLocal } from "~/utils/system/tag-related/search";
import type { TagSearchItem } from "~/utils/system/tag-related/tools/types";

export function useHsInputResults(emit: HsirEmit) {

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
  const { onInput } = initOnInput(hsirData)

  onMounted(() => {
    const iEl = inputEl.value
    if(!iEl) return
    iEl.focus()
  })


  return {
    inputEl,
    hsirData,
    onFocus,
    onBlur,
    onInput,
  }
}


function initOnInput(
  hsirData: HsirData
) {
  let lastInputTxt = ""

  const handleResult = (
    text: string,
    results: TagSearchItem[]
  ) => {
    const formattedTxt = text.replace(/\//g, " / ")
    const newList = [...results]
    const hasExisted = results.find(v => v.textBlank === formattedTxt)
    if(!hasExisted) {
      const newData: TagSearchItem = {
        tagId: "",
        textBlank: formattedTxt,
      }
      newList.splice(0, 0, newData)
    }
    hsirData.list = newList

    console.log(newList)


    if(hsirData.selectedIndex + 1 > newList.length) {
      hsirData.selectedIndex = -1
    }
  }

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
    handleResult(val2, res2)
  }


  return { onInput }
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
