// 全局发生 thread 被新增、变更
// 使用此 store 通知到各个组件

// 云同步之后的状态变更，使用 setUpdatedThreads() 来通知到各组件

import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { ContentLocalTable } from "../../types/types-table";


export const useThreadStore = defineStore("threadStore", () => {
  
  const newThreads = shallowRef<ContentLocalTable[]>([])

  const updatedThreads = shallowRef<ContentLocalTable[]>([])

  const setNewThreads = (list: ContentLocalTable[]) => {
    newThreads.value = list
    updatedThreads.value = []
  }

  const setUpdatedThreads = (list: ContentLocalTable[]) => {
    newThreads.value = []
    updatedThreads.value = list
  }

  return {
    newThreads,
    updatedThreads,
    setNewThreads,
    setUpdatedThreads,
  }
})

export type ThreadStore = ReturnType<typeof useThreadStore>