
import { provide, ref } from "vue"
import { viceViewWidthKey } from "../utils/provide-keys"

export function useMainVice() {
  const viceViewPx = ref(0)
  const onVvWidthChange = (val: number) => {
    viceViewPx.value = val
  }

  provide(viceViewWidthKey, viceViewPx)

  return { viceViewPx, onVvWidthChange }
}