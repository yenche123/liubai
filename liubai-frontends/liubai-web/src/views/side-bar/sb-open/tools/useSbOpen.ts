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
    // 1. fullscreen
    if(sidebarStatus.value === "fullscreen") return false

    // 2. current page does not have bottom-navi-bar
    if(!routeHasBottomNaviBar.value) {
      if(sidebarWidth.value > 0) return false
      return width.value > cfg.breakpoint_max_size.mobile
    }

    // 3. close if bottom-navi-bar is open
    if(Boolean(bottomNaviBar.value)) return false

    // 4. open if width is larger than mobile
    return width.value > cfg.breakpoint_max_size.mobile
  })
  
  return { show }
}