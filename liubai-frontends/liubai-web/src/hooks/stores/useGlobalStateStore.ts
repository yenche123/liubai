import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { StateShow } from "~/types/types-content";
import time from "../../utils/basic/time";

export interface KanbanStateChange {
  whyChange: "edit" | "delete"
  stateId: string
  stateShow?: StateShow
}

export const useGlobalStateStore = defineStore("globalState", () => {

  // custom-editor 里的输入框是否正在输入
  const customEditorInputing = ref(false)

  // comment-editor 里的输入框是否正在输入
  const commentEditorInputing = ref(false)

  // 全局控制器，是否能监听键盘敲击
  const canListenKeyboard = computed(() => {
    if(customEditorInputing.value) return false
    if(commentEditorInputing.value) return false
    return true
  })

  // 是否正在拖动以排序图片
  const isDragToSort = ref(false)

  // 如果 tag 发生移动、重命名、删除等情况
  const tagChangedNum = ref(0)
  const addTagChangedNum = () => {
    tagChangedNum.value += 1
  }


  // 当有看板状态发生改变时
  const kanbanStateChange = shallowRef<KanbanStateChange | null>(null)
  const setKanbanStateChange = (newV: KanbanStateChange) => {
    kanbanStateChange.value = newV
  }

  // 处理全局 selection 状态
  const lastSelectionChange = ref(0)
  const setLatestSelectionChange = () => {
    lastSelectionChange.value = time.getTime()
  }
  const isJustSelect = () => {
    const now = time.getTime()
    const diff = now - lastSelectionChange.value
    if(diff < 300) return true
    return false
  }

  return { 
    customEditorInputing, 
    commentEditorInputing,
    canListenKeyboard,
    isDragToSort,
    kanbanStateChange,
    setKanbanStateChange,
    tagChangedNum,
    addTagChangedNum,
    setLatestSelectionChange,
    isJustSelect,
  }
})

export type GlobalStateStore = ReturnType<typeof useGlobalStateStore>