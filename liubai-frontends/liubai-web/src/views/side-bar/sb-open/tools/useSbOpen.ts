import { storeToRefs } from "pinia"
import { computed } from "vue"
import { useLayoutStore } from "~/views/useLayoutStore"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"

export function useSbOpen() {

  const layout = useLayoutStore()
  const { sidebarStatus, sidebarWidth } = storeToRefs(layout)
  const { width } = useWindowSize()

  const show = computed(() => {
    if(sidebarStatus.value === "fullscreen") return false
    if(sidebarWidth.value > 0) return false
    if(width.value <= cfg.breakpoint_max_size.mobile) return false

    return true
  })
  

  return {
    show
  }
}