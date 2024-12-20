import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { StateShow } from "~/types/types-content";
import type { CommonDataChanged } from "~/types/types-atom";
import time from "~/utils/basic/time";

export interface KanbanStateChange {
  whyChange: "edit" | "delete"
  stateId: string
  stateShow?: StateShow
}

export const useGlobalStateStore = defineStore("globalState", () => {

  // varible to decide whether we have a new version
  const hasNewVersion = ref(false)

  const setNewVersion = (newVersion: boolean) => {
    const oldV = hasNewVersion.value
    if(oldV !== newVersion) {
      hasNewVersion.value = newVersion
    }
  }
  
  // window.addEventListener("load") 是否已被触发
  const windowLoaded = ref(false)

  // 微信 jsbridge 是否已准备好
  const wxJSBridgeReady = ref(false)

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
  const tagChangedReason = ref<CommonDataChanged | undefined>()
  const addTagChangedNum = (
    whyChange?: CommonDataChanged
  ) => {
    tagChangedReason.value = whyChange
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
    if(time.isWithinMillis(lastSelectionChange.value, 300)) return true
    return false
  }

  return { 
    windowLoaded,
    wxJSBridgeReady,
    customEditorInputing, 
    commentEditorInputing,
    canListenKeyboard,
    isDragToSort,

    // new version
    hasNewVersion,
    setNewVersion,

    // 看板（状态）变化
    kanbanStateChange,
    setKanbanStateChange,

    // 标签变化
    tagChangedNum,
    tagChangedReason,
    addTagChangedNum,

    // selection 划线、选中的变化
    setLatestSelectionChange,
    isJustSelect,
  }
})

export type GlobalStateStore = ReturnType<typeof useGlobalStateStore>