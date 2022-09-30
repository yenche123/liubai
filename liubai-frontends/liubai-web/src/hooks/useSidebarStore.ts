// 获取或设置全局侧边栏的宽度
// 监听 window 和 sidebar 被拖动的变化，不要写在此文件里

/**
 *   sidebarPx: 侧边栏宽度
 */

import { defineStore } from "pinia";
import { ref } from "vue";

export const useSidebarStore = defineStore("sidebar", () => {

  const sidebarPx = ref(300)
  const setSidebarPx = (val: number) => {
    sidebarPx.value = val
  }

  return { sidebarPx, setSidebarPx }
})