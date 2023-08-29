import { onMounted, reactive, ref } from "vue";
import type { HsirData, HsirEmit } from "./types";
import { 
  hasStrangeChar, 
  formatTagText, 
} from "~/utils/system/tag-related";

export function useHsInputResults(emit: HsirEmit) {

  const inputEl = ref<HTMLInputElement>()

  const hsirData = reactive<HsirData>({
    focus: false,
    inputTxt: "",
    list: [],
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


  const onInput = () => {
    let val = hsirData.inputTxt.trim()
    if(val === lastInputTxt) return
    lastInputTxt = val

    if(!val) {
      if(hsirData.inputTxt) hsirData.inputTxt = ""
      hsirData.list = []
      return
    }

    const res1 = hasStrangeChar(val)
    if(res1) {
      hsirData.list = []
      return
    }

    const val2 = formatTagText(val)
    

  }


  return { onInput }
}
