import { defineStore } from "pinia";
import { ref } from "vue";
import valTool from "~/utils/basic/val-tool"
import type { RouteLocationNormalizedLoaded } from "vue-router";

export type VvFileType = "pdf" | ""

export interface VvFileAtom {
  id: string
  url: string
  type: VvFileType
}

export const useVvFileStore = defineStore("vvfile", () => {
  
  const list = ref<VvFileAtom[]>([])

  // 获取当前路由下所对应的数据
  const getCurrentData = (
    route: RouteLocationNormalizedLoaded
  ): VvFileAtom | undefined => {
    const { vfile } = route.query
    if(!vfile || typeof vfile !== "string") return
    const data = list.value.find(v => v.id === vfile)
    return data
  }

  const getUrlById = (id: string) => {
    const data = list.value.find(v => v.id === id)
    if(!data) return
    return data.url
  }

  const addData = (url: string, type: VvFileType) => {
    const tmp = list.value
    const data = tmp.find(v => v.url === url)
    if(data) return data.id
    const num = tmp.length + 1
    const id = valTool.format0(num)
    tmp.push({ id, url, type })
    return id
  }

  return {
    getCurrentData,
    getUrlById,
    addData,
  }
})
