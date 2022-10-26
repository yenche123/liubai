// 主视图 宽度控制器

import { inject, provide, ref, Ref, watch } from "vue"
import { useLayoutStore, LayoutStore } from "../../useLayoutStore"
import { useWindowSize } from "../../../hooks/useVueUse"
import cfg from "../../../config"
import { vvKey, mvKey } from "../../../utils/provide-keys"

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
  const vvRef = inject(vvKey, ref(0))
  const { width } = useWindowSize()

  leftPx.value = layoutStore.sidebarWidth
  centerPx.value = width.value - leftPx.value - vvRef.value
  rightPx.value = vvRef.value

  provide(mvKey, centerPx)

  // 监听左边侧边栏的改变
  layoutStore.$subscribe((mutation, state) => {
    leftPx.value = state.sidebarWidth
    
    let tmpCenter = state.clientWidth - leftPx.value - vvRef.value
    // console.log("state.clientWidth: ", state.clientWidth)
    // console.log("leftPx.value: ", leftPx.value)
    // console.log("props.viceViewPx: ", props.viceViewPx)
    // console.log("tmpCenter: ", tmpCenter)
    // console.log(" ")
    if(tmpCenter < cfg.min_mainview_width) {
      rightPx.value = 0
      centerPx.value = state.clientWidth - leftPx.value
      return
    }
    rightPx.value = vvRef.value
    centerPx.value = tmpCenter
  })

  // 监听右边侧边栏的改变
  watch(vvRef, (newV) => {
    let tmpCenter = width.value - leftPx.value - newV
    if(tmpCenter < cfg.min_mainview_width) {
      rightPx.value = 0
      centerPx.value = width.value - leftPx.value
      return
    }
    
    rightPx.value = newV
    centerPx.value = tmpCenter
  })
}
