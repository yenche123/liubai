
import { ref } from "vue"

export function useMainVice() {
  const viceViewPx = ref(0)
  const onVvWidthChange = (val: number) => {
    viceViewPx.value = val
  }
  return { viceViewPx, onVvWidthChange }
}