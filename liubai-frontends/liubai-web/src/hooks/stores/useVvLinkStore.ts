// 用侧边栏打开链接的工具 store

import { ref } from "vue";
import { defineStore } from "pinia";
import type { RouteLocationNormalizedLoaded } from "vue-router"
import valTool from "~/utils/basic/val-tool"

interface VvLinkAtom {
  id: string
  url: string
}

export const useVvLinkStore = defineStore("vvlink", () => {

  const list = ref<VvLinkAtom[]>([])

  // 获取当前路由下所对应的链接
  const getCurrentLink = (
    route: RouteLocationNormalizedLoaded
  ) => {
    const { vlink } = route.query
    if(!vlink || typeof vlink !== "string") return
    const data = list.value.find(v => v.id === vlink)
    if(!data) return
    return data.url
  }

  // 添加链接至对队列里，并返回其 id
  const addLink = (url: string) => {
    const tmp = list.value
    const data = tmp.find(v => v.url === url)
    if(data) return data.id
    const num = tmp.length + 1
    const id = valTool.format0(num)
    tmp.push({ id, url })
    return id
  }


  return {
    getCurrentLink,
    addLink,
  }
})
