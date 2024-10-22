import { storeToRefs } from "pinia"
import { computed } from "vue"
import cfg from "~/config"
import { useWindowSize } from "~/hooks/useVueUse"
import { useLayoutStore } from "~/views/useLayoutStore"

export function useSbOpen() {
  const layout = useLayoutStore()
  const { 
    routeHasBottomNaviBar, 
    sidebarWidth,
    bottomNaviBar, 
    sidebarStatus,
  } = storeToRefs(layout)
  const { width } = useWindowSize()

  const show = computed(() => {
    if(sidebarStatus.value === "fullscreen") return false
    if(!routeHasBottomNaviBar.value) {
      if(sidebarWidth.value > 0) return false
      return width.value > cfg.breakpoint_max_size.mobile
    }
    return !Boolean(bottomNaviBar.value)
  })
  
  return { show }
}