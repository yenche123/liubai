import { storeToRefs } from "pinia"
import { computed } from "vue"
import { useLayoutStore } from "~/views/useLayoutStore"

export function useSbOpen() {
  const layout = useLayoutStore()
  const { bottomNaviBar, sidebarStatus } = storeToRefs(layout)
  const show = computed(() => {
    if(sidebarStatus.value === "fullscreen") return false
    return !Boolean(bottomNaviBar.value)
  })
  
  return { show }
}