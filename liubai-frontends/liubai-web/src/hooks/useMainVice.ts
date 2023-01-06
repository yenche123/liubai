
import { provide, ref } from "vue"
import { viceViewWidthKey } from "../utils/provide-keys"

export function useMainVice() {
  const viceViewPx = ref(0)
  const onVvWidthChange = (val: number) => {
    viceViewPx.value = val
  }

  // 会在每个 page 中注入，而非 vice-view 中；因为 main-view 需要得知该值再进行计算
  // 而 main-view 何 vice-view 却是兄弟组件，故才需要在它们的上级 page 中注入
  provide(viceViewWidthKey, viceViewPx)

  return { viceViewPx, onVvWidthChange }
}