import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import { ContentLocalTable } from "../../types/types-table";

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

  // 被更新或被新增的 thread 数据
  const updatedThreadData = shallowRef<ContentLocalTable>()

  return { 
    mainInputing, 
    canListenKeyboard,
    isDragToSort,
    updatedThreadData,
  }
})

export type GlobalStateStore = ReturnType<typeof useGlobalStateStore>