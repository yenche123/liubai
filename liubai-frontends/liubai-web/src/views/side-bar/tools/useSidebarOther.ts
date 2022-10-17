import { computed } from "vue";
import { useLayoutStore } from "../../useLayoutStore";


export function useSidebarOther() {

  const layoutStore = useLayoutStore()
  const innerBoxWidth = computed(() => {
    const sidebarPx = layoutStore.sidebarWidth
    if(sidebarPx < 350) return "90%"
    if(sidebarPx < 400) return "88%"
    if(sidebarPx < 450) return "86%"
    return "82%"
  })

  return { innerBoxWidth }
}