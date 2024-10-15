import { computed } from "vue"
import type { TctProps } from "./types"
import type { TooltipPlacement } from "~/components/common/liu-tooltip/tools/types"

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

  const cloudOffPlacement = computed<TooltipPlacement>(() => {
    const t = td.value
    if(t.stateShow) return `bottom`
    return `bottom-end`
  })

  return {
    td,
    showTopbar,
    cloudOffPlacement,
  }
}