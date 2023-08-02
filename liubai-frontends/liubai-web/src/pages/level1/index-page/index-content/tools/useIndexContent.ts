import { onActivated, onDeactivated, ref } from "vue";
import type { TrueOrFalse } from "~/types/types-basic"

export function useIndexContent() {
  const showTxt = ref<TrueOrFalse>("true")

  onActivated(() => {
    showTxt.value = "true"
  })

  onDeactivated(() => {
    showTxt.value = "false"
  })

  return {
    showTxt
  }
}