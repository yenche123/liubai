// 一些文字过长时，做一些处理

import thirdLink from "~/config/third-link"
import valTool from "../basic/val-tool"

/**
 * 文件名过长时，使用 js 做一些裁切处理，
 * 使之呈现诸如 "abc.....xyz.type" 貌的文字
 * @param fileName 文件名
 * @param breakpoint 断点位置
 */
function trimFileName(
  fileName: string,
  breakpoint: number = 22,
) {
  let len = fileName.length
  if(len < breakpoint) return fileName
  let res = fileName.substring(0, 12) + "......"
  res += fileName.substring(len - 7)
  return res
}


/**
 * 移除 url 追踪参数、中转链接
 */
function removeTrack(
  url: string
) {
  let _url: URL | undefined
  try {
    _url = new URL(url)
  }
  catch(err) {
    return url
  }

  if(!_url) return url
  const h = _url.hostname
  const p = _url.pathname
  const s = _url.searchParams

  // zhihu
  const zhihu1 = new URL(thirdLink.LINK_ZHIHU)
  const isZhihu1 = valTool.isInDomain(h, zhihu1.hostname)
  if(isZhihu1) {
    const tmp1 = s.get("target")
    if(tmp1) return tmp1
  }

  // zhubai
  const zhubai1 = new URL(thirdLink.LINK_ZHUBAI)
  const isZhubai1 = valTool.isInDomain(h, zhubai1.hostname)
  if(isZhubai1 && p === zhubai1.pathname) {
    const tmp1 = s.get("url")
    if(tmp1) return tmp1
  }

  // substack
  const substack1 = new URL(thirdLink.LINK_SBSTCK)
  const isSubstack1 = valTool.isInDomain(h, substack1.hostname)
  if(isSubstack1 && p.startsWith(substack1.pathname)) {
    _url.search = ""
    const tmp1 = _url.toString()
    return tmp1
  }

  // sspai
  const sspai1 = new URL(thirdLink.LINK_SSPAI)
  const isSspai1 = valTool.isInDomain(h, sspai1.hostname)
  if(isSspai1 && p === sspai1.pathname) {
    const tmp1 = s.get("target")
    if(tmp1) return tmp1
  }

  return url
}

export default {
  trimFileName,
  removeTrack,
}
