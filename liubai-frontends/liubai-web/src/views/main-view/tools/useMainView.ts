// 主视图 宽度控制器

import { inject, provide, ref, type Ref, watch } from "vue"
import { useLayoutStore, LayoutStore } from "../../useLayoutStore"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"
import { 
  viceViewWidthKey, 
  mainViewWidthKey, 
  outterWidthKey,
} from "~/utils/provide-keys"
import liuUtil from "~/utils/liu-util"
import type { MainViewProps } from "./types"

export const useMainView = (
  props: MainViewProps,
) => {

  const layoutStore = useLayoutStore()

  const leftPx = ref(0)
  const centerPx = ref(0)
  const rightPx = ref(0)
  provide(mainViewWidthKey, centerPx)
  provide(outterWidthKey, centerPx)

  if(props.disablePanels) {
    initMainView2(centerPx)
  }
  else {
    initMainView(layoutStore, leftPx, centerPx, rightPx)
  }
  
  return { leftPx, centerPx, rightPx }
}

function initMainView2(
  center: Ref<number>,
) {
  const { width } = useWindowSize()
  
  watch(width, (newV) => {
    center.value = newV
  }, { immediate: true })
}

function initMainView(
  layoutStore: LayoutStore,
  leftPx: Ref<number>, 
  centerPx: Ref<number>, 
  rightPx: Ref<number>
) {
  const vvRef = inject(viceViewWidthKey, ref(0))
  const { width } = useWindowSize()

  leftPx.value = liuUtil.calibrateSidebarWidth(layoutStore.sidebarWidth)
  centerPx.value = width.value - leftPx.value - vvRef.value
  rightPx.value = vvRef.value

  // 监听左边侧边栏 + 窗口的变化
  layoutStore.$subscribe((mutation, state) => {
    leftPx.value = liuUtil.calibrateSidebarWidth(state.sidebarWidth)

    const { clientWidth } = state
    
    const tmpCenter = clientWidth - leftPx.value - vvRef.value
    const centerRight = clientWidth - leftPx.value
    // 临界值: 取 "mainview 最小宽度" & "(全宽减掉左侧边栏)的四分之一" 的最大值
    const criticalValue = liuUtil.getMainViewCriticalValue(clientWidth, centerRight)
    // console.log("监听左边侧边栏的改变 tmpCenter: ", tmpCenter)

    // 若中间区域小于临界值，重新计算右侧宽度，使得中间的卡片能露出多一点
    // 而不是全被 vice-view 遮住
    if(tmpCenter < criticalValue) {
      let rc = getRightAndCenterPx(clientWidth, leftPx.value, vvRef.value)
      rightPx.value = rc.right
      centerPx.value = rc.center
      return
    }

    let cr = getCalibratedCenterAndRight(tmpCenter, vvRef.value)
    rightPx.value = cr.right
    centerPx.value = cr.center
  })

  // 监听右边侧边栏的改变
  watch(vvRef, (newV) => {
    const tmpCenter = width.value - leftPx.value - newV
    const centerRight = width.value - leftPx.value
    const criticalValue = liuUtil.getMainViewCriticalValue(width.value, centerRight)

    if(tmpCenter < criticalValue) {
      let rc = getRightAndCenterPx(width.value, leftPx.value, newV)
      rightPx.value = rc.right
      centerPx.value = rc.center
      return
    }
    
    let cr = getCalibratedCenterAndRight(tmpCenter, newV)
    rightPx.value = cr.right
    centerPx.value = cr.center
  })
}

function getCalibratedCenterAndRight(tmpCenter: number, tmpRight: number) {
  let px1 = tmpCenter + cfg.viceview_spacing
  let px2 = tmpRight - cfg.viceview_spacing
  if(px2 <= 0) {
    return { center: tmpCenter, right: tmpRight }
  }
  return { center: px1, right: px2 }
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
