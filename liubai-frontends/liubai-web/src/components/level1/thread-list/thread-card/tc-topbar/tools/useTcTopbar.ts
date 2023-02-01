import { computed } from "vue"
import type { TctProps } from "./types"

export function useTcTopbar(
  props: TctProps,
) {

  const showTopbar = computed(() => {
    const t = props.threadData
    if(t.pinStamp) return true
    if(t.stateId && t.stateShow) return true
    return false
  })

  return {
    showTopbar
  }
}