// 主视图 宽度控制器

import { ref, Ref, toRefs, watch } from "vue"
import { useLayoutStore, LayoutStore } from "../../useLayoutStore"
import { useWindowSize } from "../../../hooks/useVueUse"

interface MainViewProps {
  viceViewPx: number
}


export const useMainView = (props: MainViewProps) => {

  const layoutStore = useLayoutStore()

  const leftPx = ref(0)
  const centerPx = ref(0)
  const rightPx = ref(0)

  initMainView(layoutStore, props, leftPx, centerPx, rightPx)
  
  return { leftPx, centerPx, rightPx }
}

function initMainView(
  layoutStore: LayoutStore,
  props: MainViewProps,
  leftPx: Ref<number>, 
  centerPx: Ref<number>, 
  rightPx: Ref<number>
) {
  const { width, height } = useWindowSize()

  leftPx.value = layoutStore.sidebarWidth
  centerPx.value = width.value - leftPx.value - props.viceViewPx
  rightPx.value = props.viceViewPx

  // 监听左边侧边栏的改变
  layoutStore.$subscribe((mutation, state) => {
    leftPx.value = state.sidebarWidth
    centerPx.value = width.value - leftPx.value - props.viceViewPx
  })

  // 监听右边侧边栏的改变
  watch(() => props.viceViewPx, (newV) => {
    rightPx.value = newV
    centerPx.value = width.value - leftPx.value - newV
  })
}
