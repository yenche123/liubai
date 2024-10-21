import { defineStore } from "pinia";
import { ref } from "vue";
import { useWindowSize } from "../hooks/useVueUse";
import type { Prettify } from "~/utils/basic/type-tool";
import cfg from "~/config";
import type { OpenType } from "~/types/types-view";

export type LayoutChangeType = "window" | "sidebar" | ""

// sidebar状态: 
//   default 表示根据用户拖动边框的自然状态; 
//   fullscreen 表示用户手动点击输入框的全屏;
export type SidebarStatus = "default" | "fullscreen"

export const useLayoutStore = defineStore("layout", () => {
  const { width } = useWindowSize()
  
  // about sidebar
  const sidebarWidth = ref(_initSidebarWidth(width.value))    // 如果侧边栏收起来时，该值为 0
  const sidebarType = ref<OpenType>("opened")
  const clientWidth = ref(width.value)
  const changeType = ref<LayoutChangeType>("")
  const sidebarStatus = ref<SidebarStatus>("default")

  // about bottom navi bar
  const routeHasBottomNaviBar = ref(false)  // 当前页面是否可能存在 bottom-navi-bar
  const bottomNaviBar = ref(false)          // 若当前页面存在 bottom-navi-bar，它是否被显示
  const bnbHeight = ref(0)

  // go to top about bottom-navi-bar
  const bnbGoToTop = ref(0)
  const triggerBnbGoToTop = () => {
    bnbGoToTop.value++
  }

  return { 
    sidebarWidth, 
    sidebarType,
    clientWidth,
    changeType,
    sidebarStatus,
    routeHasBottomNaviBar,
    bottomNaviBar,
    bnbHeight,
    bnbGoToTop,
    triggerBnbGoToTop,
  }
})

export type LayoutStore = Prettify<ReturnType<typeof useLayoutStore>>
export interface LayoutType {
  sidebarWidth: number
  sidebarType: OpenType
  clientWidth: number
  changeType: LayoutChangeType
}

function _initSidebarWidth(windowWidth: number) {
  let res = Math.round(windowWidth / 5)
  if(res < cfg.default_sidebar_width) {
    res = cfg.default_sidebar_width
  }
  else if(res > 450) {
    res = 450
  }

  return res
}