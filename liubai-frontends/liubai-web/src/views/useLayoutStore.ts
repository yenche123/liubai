import { defineStore } from "pinia";
import { ref } from "vue";
import cfg from "../config";
import { useWindowSize } from "../hooks/useVueUse"

export type LayoutChangeType = "window" | "sidebar" | ""

// sidebar状态: default 表示根据用户拖动边框的自然状态; window 表示用户手动点击输入框的全屏
export type SidebarStatus = "default" | "window"

export const useLayoutStore = defineStore("layout", () => {
  const { width } = useWindowSize()
  
  // 需要返回的数据
  const sidebarWidth = ref(cfg.default_sidebar_width)    // 如果侧边栏收起来时，该值为 0
  const clientWidth = ref(width.value)
  const changeType = ref<LayoutChangeType>("")
  const sidebarStatus = ref<SidebarStatus>("default")

  return { 
    sidebarWidth, 
    clientWidth,
    changeType,
    sidebarStatus,
  }
})

export type LayoutStore = ReturnType<typeof useLayoutStore>
export interface LayoutType {
  sidebarWidth: number
  clientWidth: number
  changeType: LayoutChangeType
}