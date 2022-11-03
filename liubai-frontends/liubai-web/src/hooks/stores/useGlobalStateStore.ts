import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useGlobalStateStore = defineStore("globalState", () => {

  // main-view 里的输入框是否正在输入
  const mainInputing = ref(false)

  // 全局控制器，是否能监听键盘敲击
  const canListenKeyboard = computed(() => {
    if(mainInputing.value) return false
    return true
  })

  // 是否正在拖动以排序图片
  const isDragToSort = ref(false)

  return { 
    mainInputing, 
    canListenKeyboard,
    isDragToSort,
  }
})