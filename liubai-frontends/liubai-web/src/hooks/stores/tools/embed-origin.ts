

// 将原链接转为嵌入链接

import thirdLink from "~/config/third-link"
import valTool from "~/utils/basic/val-tool"
import liuEnv from "~/utils/liu-env"

const x = "__XXX__"

// 若无需转换，返回 undefined
export function getEmbedUrlStr(originUrl: string) {
  const url = new URL(originUrl)
  const h = url.hostname
  const p = url.pathname
  const pLen = p.length
  const s = url.searchParams

  let tmp: string = ""

  // 适配 youtube /watch
  const yt = thirdLink.YOUTUBE_EMBED
  const yt1 = new URL(thirdLink.YOUTUBE_COMMON)
  let isYouTube1 = valTool.isInDomain(h, yt1.hostname) && p === "/watch"
  if(isYouTube1) {
    const v = s.get("v")
    if(v) {
      return yt.replace(x, v)
    }
  }

  // 适配 youtube 短链接  https://youtu.be/__XXX__
  const yt2 = new URL(thirdLink.YOUTUBE_SHORT)
  const isYouTube2 = valTool.isInDomain(h, yt2.hostname) && pLen > 5
  if(isYouTube2) {
    tmp = p.substring(1)
    if(tmp[tmp.length - 1] === "/") {
      tmp = tmp.substring(0, tmp.length - 1)
    }
    return yt.replace(x, tmp)
  }

  // 如果直接是 yt /embed 的话
  const yt3 = new URL(yt)
  const ytReg3 = /(?<=\/embed\/)\w{5,16}/g
  const isYouTube3 = valTool.isInDomain(h, yt3.hostname)
  const ytMatch3 = p.match(ytReg3)
  if(isYouTube3 && ytMatch3) {
    if(!s.has("autoplay")) {
      s.set("autoplay", "1")
    }
    return originUrl
  }

  // 适配 bilibili /video
  const b = thirdLink.BILIBILI_PLAYER
  const b1 = new URL(thirdLink.BILIBILI_COMMON)
  const bReg1 = /(?<=\/video\/)\w{5,16}/g
  const isBili1 = valTool.isInDomain(h, b1.hostname)
  const bMatch1 = p.match(bReg1)
  if(isBili1 && bMatch1) {
    const v = bMatch1[0]
    if(v) return b.replace(x, v)
  }

  // 如果是 bilibili player.bilibili.com/player.html 的话
  const b2 = new URL(b)
  const isBili2 = valTool.isInDomain(h, b2.hostname) && p === "/player.html"
  const hasBvid = s.has("bvid")
  if(isBili2 && hasBvid) {
    return originUrl
  }


  // 适配 loom /share
  const loom = thirdLink.LOOM_EMBED
  const loom1 = new URL(thirdLink.LOOM_SHARE)
  const lReg1 = /(?<=\/share\/)\w{16,48}/g
  const isLoom1 = valTool.isInDomain(h, loom1.hostname)
  const lMatch1 = p.match(lReg1)
  if(isLoom1 && lMatch1) {
    const v = lMatch1[0]
    if(v) {
      return loom.replace(x, v)
    }
  }

  // 如果是 loom /embed
  const loom2 = new URL(loom)
  const lReg2 = /(?<=\/embed\/)\w{16,48}/g
  const isLoom2 = valTool.isInDomain(h, loom2.hostname)
  const lMatch2 = p.match(lReg2)
  if(isLoom2 && lMatch2) {
    return originUrl
  }

  // 如果是 Google Docs 的 preview 页，直接返回 原连接
  const gDocs = thirdLink.GOOGLE_DOCS
  const gDocs1 = new URL(gDocs)
  const isGDocs1 = valTool.isInDomain(h, gDocs1.hostname)
  if(isGDocs1) {
    // document 的情况，通常其路由的 id 部分为 44 个字符
    const gDocsReg1 = /(?<=\/document\/d\/)\w{40,48}(?=\/preview)/g
    const gDocsMatch1 = p.match(gDocsReg1)
    if(gDocsMatch1) return originUrl

    // spreadsheets 的情况
    const gDocsReg2 = /(?<=\/spreadsheets\/d\/)\w{40,48}(?=\/preview)/g
    const gDocsMatch2 = p.match(gDocsReg2)
    if(gDocsMatch2) return originUrl

    // presentation 的情况
    const gDocsReg3 = /(?<=\/presentation\/d\/)\w{40,48}(?=\/preview)/g
    const gDocsMatch3 = p.match(gDocsReg3)
    if(gDocsMatch3) return originUrl
  }


  // 如果是 Google Maps 的 embed 页，直接返回原链接
  const gMaps = thirdLink.GOOGLE_MAPS
  const gMaps1 = new URL(gMaps)
  const isGMaps1 = valTool.isInDomain(h, gMaps1.hostname)
  if(isGMaps1) {
    const gMapsReg1 = /\/maps\/embed[\/\?]+/g
    const gMapsMatch1 = originUrl.match(gMapsReg1)
    if(gMapsMatch1) return originUrl
  }


  return
}


// 将嵌入链接转为原链接
// 注意: 返回的是 URL 对象
export function getOriginURL(embedUrl: string) {

  const url = new URL(embedUrl)
  const h = url.hostname
  const p = url.pathname
  const s = url.searchParams

  const proxy_key = "alt_url"
  const extractFromProxy = () => {
    const tmp = s.get(proxy_key)
    return tmp
  }

  // 1. 检查是否在 proxy 里头
  const env = liuEnv.getEnv()
  const { IFRAME_PROXY } = env
  if(IFRAME_PROXY) {
    const hasProxy = embedUrl.includes(IFRAME_PROXY)
    if(hasProxy) {
      const res = extractFromProxy()
      if(res) {
        return new URL(res)
      }
    }
  }

  // 2. 检查是否为 yt embed
  const yt = thirdLink.YOUTUBE_COMMON
  const yt1 = new URL(thirdLink.YOUTUBE_EMBED)
  const ytReg = /(?<=\/embed\/)\w{5,16}/g 
  const isYouTube1 = valTool.isInDomain(h, yt1.hostname)
  const ytMatch = p.match(ytReg)
  if(isYouTube1 && ytMatch) {
    const v = ytMatch[0]
    if(v) return new URL(yt.replace(x, v))
  }

  // 3. 检查是否为 bilibili embed
  const bili = thirdLink.BILIBILI_COMMON
  const bili1 = new URL(thirdLink.BILIBILI_PLAYER)
  const isBili = valTool.isInDomain(h, bili1.hostname) && p === "/player.html"
  if(isBili) {
    const bvid = s.get("bvid")
    if(bvid) return new URL(bili.replace(x, bvid))
  }

  // 4. 检查是否为 loom
  const loom = thirdLink.LOOM_SHARE
  const loom1 = new URL(thirdLink.LOOM_EMBED)
  const loomReg = /(?<=\/embed\/)\w{16,48}/g 
  const isLoom = valTool.isInDomain(h, loom1.hostname)
  const loomMatch = p.match(loomReg)
  if(isLoom && loomMatch) {
    const v = loomMatch[0]
    if(v) return new URL(loom.replace(x, v))
  }

  // n. 最后，检查是否存在 google 的 igu 参数
  const gUrl = new URL(thirdLink.GOOGLE_SEARCH)
  const isGoogle = valTool.isInDomain(h, gUrl.hostname)
  if(isGoogle && s.has("igu")) {
    s.delete("igu")
  }

  return url
}