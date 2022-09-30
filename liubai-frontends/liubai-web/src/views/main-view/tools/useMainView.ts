// 主视图 宽度控制器

import { ref, Ref } from "vue"
import { useLayoutStore, LayoutStore } from "../../useLayoutStore"
import { useWindowSize } from "../../../hooks/useVueUse"

export const useMainView = () => {

  const layoutStore = useLayoutStore()

  const leftPx = ref(0)
  const centerPx = ref(0)
  const rightPx = ref(0)

  initMainView(layoutStore, leftPx, centerPx, rightPx)
  
  return { leftPx, centerPx, rightPx }
}

function initMainView(
  layoutStore: LayoutStore,
  leftPx: Ref<number>, 
  centerPx: Ref<number>, 
  rightPx: Ref<number>
) {
  const { width, height } = useWindowSize()

  console.log("initMainView.............")
  console.log(width)
  console.log(" ")

  leftPx.value = layoutStore.sidebarWidth
  centerPx.value = width.value - leftPx.value - rightPx.value
}
