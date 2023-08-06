// 用侧边栏打开链接的工具 store

import { ref } from "vue";
import { defineStore } from "pinia";
import type { RouteLocationNormalizedLoaded } from "vue-router"
import valTool from "~/utils/basic/val-tool"
import { domainAllowed, domainNotAllowed, mastodonDomains } from "~/config/domain-list"
import { getEmbedData, getOriginURL } from "./tools/embed-origin"
import { isSpecialLink } from "./tools/handle-special-link"

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

  const getUrlById = (id: string) => {
    const data = list.value.find(v => v.id === id)
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
    getUrlById,
    addLink,
    canAdd,
    isInAllowedList,
    getEmbedData,
    getOriginURL,
    isSpecialLink,
  }
})

// 检查该链接是否允许在侧边栏打开
function canAdd(url: string) {
  const p0 = location.protocol
  const u = new URL(url)
  const p = u.protocol
  if(p !== "http:" && p !== "https:") return false
  if(p === "http:" && p0 === "https:") return false

  const h = u.hostname
  const embedData = getEmbedData(url)
  if(embedData) return true

  const res1 = isSpecialLink(url)
  if(res1) return true

  const data1 = domainAllowed.find(v => valTool.isInDomain(h, v))
  if(data1) return true

  const data2 = domainNotAllowed.find(v => valTool.isInDomain(h, v))
  if(data2) return false

  const data3 = mastodonDomains.find(v => valTool.isInDomain(h, v))
  if(data3) return false

  return true
}

// 检查该链接是否可直接打开，而无需代理
function isInAllowedList(url: string) {
  const u = new URL(url)
  const h = u.hostname
  const data = domainAllowed.find(v => valTool.isInDomain(h, v))
  return Boolean(data)
}

