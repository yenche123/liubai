import { computed } from "vue"
import type { TctProps } from "./types"
import { useDynamics } from "~/hooks/useDynamics"

export function useTcTopbar(
  props: TctProps,
) {

  const showTopbar = computed(() => {
    const t = props.threadData
    if(t.pinStamp) return true
    if(t.stateId && t.stateShow) return true
    return false
  })

  const stateColor = computed(() => {
    const s = props.threadData?.stateShow?.colorShow
    if(!s) return ""
    return s
  })

  const { theme } = useDynamics()

  return {
    showTopbar,
    stateColor,
    theme,
  }
}