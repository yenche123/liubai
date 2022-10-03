import { defineStore } from "pinia";
import { ref } from "vue";
import cfg from "../config";
import { useWindowSize } from "../hooks/useVueUse"

export type LayoutChangeType = "window" | "sidebar" | ""

// 给 main-view 和 detail-view 接收变化用的

export const useLayoutStore = defineStore("layout", () => {
  const { width, height } = useWindowSize()
  // console.log("1111111111111")
  // console.log(width.value)
  // console.log(" ")
  
  // 需要返回的数据
  const sidebarWidth = ref(cfg.default_sidebar_width)    // 如果侧边栏收起来时，该值为 0
  const clientWidth = ref(width.value)
  const changeType = ref<LayoutChangeType>("")

  return { 
    sidebarWidth, 
    clientWidth,
    changeType,
  }
})

export type LayoutStore = ReturnType<typeof useLayoutStore>