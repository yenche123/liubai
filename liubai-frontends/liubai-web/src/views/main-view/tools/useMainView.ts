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

  leftPx.value = getCalibratedLeft(layoutStore.sidebarWidth)
  centerPx.value = width.value - leftPx.value - vvRef.value
  rightPx.value = vvRef.value

  provide(mainViewWidthKey, centerPx)
  provide(outterWidthKey, centerPx)

  // 监听左边侧边栏的改变
  layoutStore.$subscribe((mutation, state) => {
    leftPx.value = getCalibratedLeft(state.sidebarWidth)
    
    const tmpCenter = state.clientWidth - leftPx.value - vvRef.value
    const centerRight = state.clientWidth - leftPx.value
    // 临界值: 取 "mainview 最小宽度" & "(全宽减掉左侧边栏)的三分之一" 的最大值
    const criticalValue = Math.max(cfg.min_mainview_width, centerRight / 3)
    // console.log("监听左边侧边栏的改变 tmpCenter: ", tmpCenter)

    if(tmpCenter < criticalValue) {
      let rc = getRightAndCenterPx(state.clientWidth, leftPx.value, vvRef.value)
      rightPx.value = rc.right
      centerPx.value = rc.center
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

    if(tmpCenter < criticalValue) {
      let rc = getRightAndCenterPx(width.value, leftPx.value, newV)
      rightPx.value = rc.right
      centerPx.value = rc.center
      return
    }
    
    rightPx.value = newV
    centerPx.value = tmpCenter
  })
}

function getCalibratedLeft(sidebarWidth: number) {
  let val = sidebarWidth - cfg.sidebar_spacing
  if(val < 0) val = 0
  return val
}


function getRightAndCenterPx(
  screenPx: number,
  topLeftPx: number,
  topRightPx: number,
) {
  let originCenter = screenPx - topLeftPx
  let tmpCenter = originCenter
  if(tmpCenter <= 800 || topRightPx < 1) {
    return { right: 0, center: originCenter }
  }

  let tmpRight = Math.round(topRightPx / 2)
  tmpCenter = originCenter - tmpRight
  if(tmpCenter > 800) {
    return { right: tmpRight, center: tmpCenter }
  }

  tmpRight = Math.round(topRightPx / 3)
  tmpCenter = originCenter - tmpRight
  if(tmpCenter > 800) {
    return { right: tmpRight, center: tmpCenter }
  }

  tmpRight = Math.round(topRightPx / 4)
  tmpCenter = originCenter - tmpRight
  if(tmpCenter > 800) {
    return { right: tmpRight, center: tmpCenter }
  }

  return { right: 0, center: originCenter }
}
