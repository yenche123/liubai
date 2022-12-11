import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useLayoutStore } from "../../../../views/useLayoutStore";

export function useCeToolbar() {
  const layout = useLayoutStore()
  const { sidebarStatus } = storeToRefs(layout)
  const expanded = computed(() => {
    if(sidebarStatus.value === "fullscreen") return true
    return false
  })

  const onTapExpand = () => {
    const newV = sidebarStatus.value === "fullscreen" ? "default" : "fullscreen"
    layout.$patch({ sidebarStatus: newV })
  }

  return { expanded, onTapExpand }
}