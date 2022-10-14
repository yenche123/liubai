// 主视图 宽度控制器

import { onMounted, ref, Ref, toRefs, watch } from "vue"
import { useLayoutStore, LayoutStore } from "../../useLayoutStore"
import { useWindowSize } from "../../../hooks/useVueUse"
import cfg from "../../../config"
import cui from "../../../components/custom-ui"

interface MainViewProps {
  viceViewPx: number
}


export const useMainView = (props: MainViewProps) => {

  const layoutStore = useLayoutStore()

  const leftPx = ref(0)
  const centerPx = ref(0)
  const rightPx = ref(0)

  initMainView(layoutStore, props, leftPx, centerPx, rightPx)

  onMounted(() => {
    cui.showModal({
      title: "Hello World!",
      content: "你好！欢迎！！",
    })
  })
  
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
    
    let tmpCenter = state.clientWidth - leftPx.value - props.viceViewPx
    console.log("state.clientWidth: ", state.clientWidth)
    console.log("leftPx.value: ", leftPx.value)
    console.log("props.viceViewPx: ", props.viceViewPx)
    console.log("tmpCenter: ", tmpCenter)
    console.log(" ")
    if(tmpCenter < cfg.min_mainview_width) {
      rightPx.value = 0
      centerPx.value = state.clientWidth - leftPx.value
      return
    }
    rightPx.value = props.viceViewPx
    centerPx.value = tmpCenter
  })

  // 监听右边侧边栏的改变
  watch(() => props.viceViewPx, (newV) => {
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
