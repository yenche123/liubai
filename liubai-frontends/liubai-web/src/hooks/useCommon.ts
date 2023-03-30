// 一些常用的响应式工具函数

import { storeToRefs } from "pinia"
import { computed } from "vue"
import { useWorkspaceStore } from "./stores/useWorkspaceStore"


// 获取路径的前缀
// 如果当前非个人工作区，就会加上 `/w/${spaceId}`
export function usePrefix() {
  const wStore = useWorkspaceStore()
  const { isCollaborative, spaceId } = storeToRefs(wStore)
  const prefix = computed(() => {
    const isCo = isCollaborative.value
    if(isCo) return `/w/${spaceId.value}/`
    return `/`
  })

  return { prefix }
}