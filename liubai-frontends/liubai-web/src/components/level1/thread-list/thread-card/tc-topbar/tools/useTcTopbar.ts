import { computed } from "vue"
import type { TctProps } from "./types"
import { useDynamics } from "~/hooks/useDynamics"

export function useTcTopbar(
  props: TctProps,
) {
  const td = computed(() => props.threadData)

  const showTopbar = computed(() => {
    const t = td.value
    if(t.pinStamp) return true
    if(t.stateId && t.stateShow) return true
    if(t.storageState === `LOCAL` || t.storageState === `ONLY_LOCAL`) return true
    return false
  })

  const stateColor = computed(() => {
    const s = td.value.stateShow?.colorShow
    if(!s) return ""
    return s
  })

  const { theme } = useDynamics()

  return {
    td,
    showTopbar,
    stateColor,
    theme,
  }
}