// 主视图 宽度控制器

import { inject, provide, ref, Ref, watch } from "vue"
import { useLayoutStore, LayoutStore } from "../../useLayoutStore"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"
import { viceViewWidthKey, mainViewWidthKey, outterWidthKey } from "~/utils/provide-keys"

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
  const vvRef = inject(viceViewWidthKey, ref(0))
  const { width } = useWindowSize()

  leftPx.value = layoutStore.sidebarWidth
  centerPx.value = width.value - leftPx.value - vvRef.value
  rightPx.value = vvRef.value

  provide(mainViewWidthKey, centerPx)
  provide(outterWidthKey, centerPx)

  // 监听左边侧边栏的改变
  layoutStore.$subscribe((mutation, state) => {
    leftPx.value = state.sidebarWidth
    
    const tmpCenter = state.clientWidth - leftPx.value - vvRef.value
    const centerRight = state.clientWidth - leftPx.value
    // 临界值: 取 "mainview 最小宽度" & "(全宽减掉左侧边栏)的三分之一" 的最大值
    const criticalValue = Math.max(cfg.min_mainview_width, centerRight / 3)
    // console.log("监听左边侧边栏的改变 tmpCenter: ", tmpCenter)

    if(tmpCenter < criticalValue) {
      rightPx.value = 0
      centerPx.value = state.clientWidth - leftPx.value
      return
    }
    rightPx.value = vvRef.value
    centerPx.value = tmpCenter
  })

  // 监听右边侧边栏的改变
  watch(vvRef, (newV) => {
    const tmpCenter = width.value - leftPx.value - newV
    const centerRight = width.value - leftPx.value
    const criticalValue = Math.max(cfg.min_mainview_width, centerRight / 3)
    console.log("tmpCenter: ", tmpCenter)

    if(tmpCenter < criticalValue) {
      rightPx.value = 0
      centerPx.value = width.value - leftPx.value
      return
    }
    
    rightPx.value = newV
    centerPx.value = tmpCenter
  })
}
