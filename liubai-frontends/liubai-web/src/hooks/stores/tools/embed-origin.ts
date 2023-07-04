

// 将原链接转为嵌入链接

import thirdLink from "~/config/third-link"
import valTool from "~/utils/basic/val-tool"
import liuEnv from "~/utils/liu-env"

// 若无需转换，返回 undefined
export function getEmbedUrlStr(originUrl: string) {
  const url = new URL(originUrl)
  const h = url.hostname
  const p = url.pathname
  const pLen = p.length
  const s = url.searchParams

  const x = "__XXX__"
  let tmp: string = ""

  // 适配 youtube
  const yt = thirdLink.YOUTUBE_EMBED
  const yt1 = new URL(thirdLink.YOUTUBE_COMMON)
  let isYouTube1 = valTool.isInDomain(h, yt1.hostname) && p === "/watch"
  if(isYouTube1) {
    const v = s.get("v")
    if(v) {
      return yt.replace(x, v)
    }
  }

  // 适配 youtube 短链接
  const yt2 = new URL(thirdLink.YOUTUBE_SHORT)
  const isYouTube2 = valTool.isInDomain(h, yt2.hostname) && pLen > 5
  if(isYouTube2) {
    tmp = p.substring(1)
    if(tmp[tmp.length - 1] === "/") {
      tmp = tmp.substring(0, tmp.length - 1)
    }
    return yt.replace(x, tmp)
  }

  // 适配 bilibili
  const b = thirdLink.BILIBILI_PLAYER
  const b1 = new URL(thirdLink.BILIBILI_COMMON)
  const bReg1 = /(?<=\/video\/)\w{5,16}/g
  const isBili1 = valTool.isInDomain(h, b1.hostname)
  const bMatch1 = p.match(bReg1)
  if(isBili1 && bMatch1) {
    const v = bMatch1[0]
    if(v) {
      return b.replace(x, v)
    }
  }

  // 适配 loom
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


  // n. 最后，检查是否存在 google 的 igu 参数
  if(s.has("igu")) {
    s.delete("igu")
  }

  return url
}