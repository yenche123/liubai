import { onMounted, reactive, ref } from "vue";
import type { HsirData, HsirEmit } from "./types";

export function useHsInputResults(emit: HsirEmit) {

  const inputEl = ref<HTMLInputElement>()

  const hsirData = reactive<HsirData>({
    focus: false,
    inputTxt: "",
  })

  const onFocus = () => {
    hsirData.focus = true
    emit("focusornot", true)
  }

  const onBlur = () => {
    hsirData.focus = false
    emit("focusornot", false)
  }

  const onInput = () => {
    let val = hsirData.inputTxt.trim()
    console.log("val: ", val)
  }

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