
import { provide, ref } from "vue"
import { vvKey } from "../utils/provide-keys"

export function useMainVice() {
  const viceViewPx = ref(0)
  const onVvWidthChange = (val: number) => {
    viceViewPx.value = val
  }

  provide(vvKey, viceViewPx)

  return { viceViewPx, onVvWidthChange }
}