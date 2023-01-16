
// 全局发生 thread 被新增、变更
// 使用此 store 通知到各个组件
// 如果是点赞、评论数的变化，由其他工具函数最终触发该函数来改变
// 不要在这个 store 里写动态操作（点赞、评论、收藏）的逻辑

import { defineStore } from "pinia";
import { shallowRef } from "vue";
import type { ThreadShow } from "~/types/types-content"
import type { WhyThreadChange } from "~/types/types-atom"

export const useThreadShowStore = defineStore("threadShow", () => {

  const newThreadShows = shallowRef<ThreadShow[]>([])

  // 点赞、评论、收藏等操作，也是修改以下变量
  const updatedThreadShows = shallowRef<ThreadShow[]>([])
  const whyChange = shallowRef<WhyThreadChange>("")

  const setNewThreadShows = (list: ThreadShow[]) => {
    whyChange.value = ""
    newThreadShows.value = list
    updatedThreadShows.value = []
  }

  const setUpdatedThreadShows = (
    list: ThreadShow[], 
    whyThreadChange: WhyThreadChange = ""
  ) => {
    whyChange.value = whyThreadChange
    updatedThreadShows.value = list
    newThreadShows.value = []
  }

  return {
    whyChange,
    newThreadShows,
    updatedThreadShows,
    setNewThreadShows,
    setUpdatedThreadShows,
  }
})

export type ThreadShowStore = ReturnType<typeof useThreadShowStore> 