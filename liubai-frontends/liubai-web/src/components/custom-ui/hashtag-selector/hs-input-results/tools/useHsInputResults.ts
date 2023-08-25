import { onMounted, reactive, ref } from "vue"
import type { HsirData } from "./types"

export function useHsInputResults() {

  const inputEl = ref<HTMLInputElement>()

  const hsirData = reactive<HsirData>({
    focus: false
  })

  const onFocus = () => {
    hsirData.focus = true
  }

  const onBlur = () => {
    hsirData.focus = false
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
  }
}