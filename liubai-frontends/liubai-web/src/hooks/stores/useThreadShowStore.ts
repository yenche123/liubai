
// 全局发生 thread 被新增、变更
// 使用此 store 通知到各个组件
// 如果是点赞、评论数的变化，由其他工具函数最终触发该函数来改变
// 不要在这个 store 里写动态操作（点赞、评论、收藏）的逻辑

import { defineStore } from "pinia";
import { shallowRef } from "vue";
import type { ThreadShow } from "../../types/types-content"

export const useThreadShowStore = defineStore("threadShow", () => {

  const newThreadShows = shallowRef<ThreadShow[]>([])

  // 点赞、评论、收藏等操作，也是修改以下变量
  const updatedThreadShows = shallowRef<ThreadShow[]>([])

  const setNewThreadShows = (list: ThreadShow[]) => {
    newThreadShows.value = list
    updatedThreadShows.value = []
  }

  const setUpdatedThreadShows = (list: ThreadShow[]) => {
    updatedThreadShows.value = list
    newThreadShows.value = []
  }

  return {
    newThreadShows,
    updatedThreadShows,
    setNewThreadShows,
    setUpdatedThreadShows,
  }
})

export type ThreadShowStore = ReturnType<typeof useThreadShowStore> 