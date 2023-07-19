import thirdLink from "~/config/third-link"
import valTool from "~/utils/basic/val-tool"
import liuEnv from "~/utils/liu-env"

const x = "__XXX__"

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
  const yt = thirdLink.YOUTUBE_WATCH
  const yt1 = new URL(thirdLink.YOUTUBE_EMBED)
  const yt2 = new URL(thirdLink.YOUTUBE_PLAYLIST)
  const isYouTube1 = valTool.isInDomain(h, yt1.hostname)
  if(isYouTube1) {

    // 判断嵌入的是否为 播放清单
    const ytList = s.get("list")
    if(p === "/embed/videoseries" && ytList) {
      yt2.searchParams.set("list", ytList)
      return yt2
    }

    // 判断嵌入的是否为 单个视频
    const ytReg = /(?<=\/embed\/)\w{5,16}/g 
    const ytMatch = p.match(ytReg)
    if(ytMatch) {
      const v = ytMatch[0]
      return new URL(yt.replace(x, v))
    }
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

  // 5. 检查是否为 figma
  const figma = thirdLink.FIGMA_EMBED
  const figma1 = new URL(figma)
  const isFigma = valTool.isInDomain(h, figma1.hostname)
  if(isFigma) {
    const figmaEmbedPath = `/embed`
    const _url = s.get("url")
    const _uLength = _url?.length ?? 0
    if(p === figmaEmbedPath && _url && _uLength > 20) {
      return new URL(_url)
    }
  }

  // 6. 检查是否为 spotify
  const spotify = thirdLink.SPOTIFY_OPEN
  const spotify1 = new URL(spotify)
  const isSpotify = valTool.isInDomain(h, spotify1.hostname)
  if(isSpotify) {
    const spotifyEmbedPath = "/embed"
    const hasEmbed = p.indexOf(spotifyEmbedPath) === 0
    if(hasEmbed) {
      s.delete("theme")
      url.pathname = p.substring(spotifyEmbedPath.length)
    }
    return url
  }

  // 7. 检查是否为 apple music
  const apMusic1 = new URL(thirdLink.APPLE_MUSIC_EMBED)
  const isAppleMusic = valTool.isInDomain(h, apMusic1.hostname)
  if(isAppleMusic) {
    const apMusic2 = new URL(thirdLink.APPLE_MUSIC)
    url.hostname = apMusic2.hostname
    return url
  }

  // 8. 检查是否为 apple podcast
  const apPodcast1 = new URL(thirdLink.APPLE_PODCAST_EMBED)
  const isApplePodcast = valTool.isInDomain(h, apPodcast1.hostname)
  if(isApplePodcast) {
    const apPodcast2 = new URL(thirdLink.APPLE_PODCAST)
    url.hostname = apPodcast2.hostname
    return url
  }

  // n. 最后，检查是否存在 google 的 igu 参数
  const gUrl = new URL(thirdLink.GOOGLE_SEARCH)
  const isGoogle = valTool.isInDomain(h, gUrl.hostname)
  if(isGoogle && s.has("igu")) {
    s.delete("igu")
  }

  return url
}