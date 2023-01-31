import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useLayoutStore } from "~/views/useLayoutStore";

export function useIndexContent() {

  // 判断是否显示最顶部的边距
  const layoutStore = useLayoutStore()
  const { sidebarWidth, sidebarStatus } = storeToRefs(layoutStore)
  const showTop = computed(() => {
    if(sidebarStatus.value === "fullscreen") return true
    if(sidebarWidth.value <= 0) return false
    return true
  })

  return { showTop }
}