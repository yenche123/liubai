import { defineStore } from "pinia";
import { ref } from "vue";
import cfg from "../config";
import { useWindowSize } from "../hooks/useVueUse"

// 给 main-view 和 detail-view 接收变化用的

export const useLayoutStore = defineStore("layout", () => {
  
  const { width, height } = useWindowSize()
  
  // 需要返回的数据
  const sidebarWidth = ref(cfg.default_sidebar_width)
  const clientWidth = ref(width.value)
  const clientHeight = ref(height.value)

  return { 
    sidebarWidth, 
    clientWidth, 
    clientHeight,
  }
})

export type LayoutStore = ReturnType<typeof useLayoutStore>