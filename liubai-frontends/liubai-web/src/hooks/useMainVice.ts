
import { ref } from "vue"

export function useMainVice() {
  const viceViewPx = ref(0)
  const onVvWidthChange = (val: number) => {
    console.log("监听到副视图发生变化: ", val)
    console.log(" ")
    viceViewPx.value = val
  }
  return { viceViewPx, onVvWidthChange }
}