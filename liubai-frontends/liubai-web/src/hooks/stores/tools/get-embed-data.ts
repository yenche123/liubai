import thirdLink from "~/config/third-link"
import { useDynamics } from "~/hooks/useDynamics"
import valTool from "~/utils/basic/val-tool"
import liuApi from "~/utils/liu-api"
import { mastodonDomains } from "~/config/domain-list"

const x = "__XXX__"

export interface EmbedDataRes {
  link: string
  otherData?: Record<string, any>
}

// 若无需转换，返回 undefined
export function getEmbedData(
  originUrl: string
): EmbedDataRes | undefined {
  const url = new URL(originUrl)
  const h = url.hostname
  const p = url.pathname
  const pLen = p.length
  const s = url.searchParams

  const { theme } = useDynamics()
  const themeVal = theme.value
  let tmp: string = ""

  // 适配 youtube /watch
  const yt = thirdLink.YOUTUBE_EMBED
  const yt1 = new URL(thirdLink.YOUTUBE_WATCH)
  const ytRes: EmbedDataRes = { link: originUrl, otherData: { isYouTube: true } }
  let isYouTube1 = valTool.isInDomain(h, yt1.hostname) && p === "/watch"
  if(isYouTube1) {
    const v = s.get("v")
    if(v) {
      ytRes.link = yt.replace(x, v)
      return ytRes
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
    ytRes.link = yt.replace(x, tmp)
    return ytRes
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
    return ytRes
  }

  // 如果是 yt 的播放清单
  const yt4 = new URL(thirdLink.YOUTUBE_PLAYLIST)
  const isYouTube4 = valTool.isInDomain(h, yt4.hostname) && p === "/playlist"
  if(isYouTube4) {
    const ytList = s.get("list")
    const yt5 = new URL(thirdLink.YOUTUBE_VIDEOSERIES)
    if(ytList) {
      yt5.searchParams.set("list", ytList)
      yt5.searchParams.set("autoplay", "1")
      ytRes.link = yt5.toString()
      return ytRes
    }
  }

  // 适配 bilibili /video
  const b = thirdLink.BILIBILI_PLAYER
  const b1 = new URL(thirdLink.BILIBILI_COMMON)
  const bReg1 = /(?<=\/video\/)\w{5,16}/g
  const isBili1 = valTool.isInDomain(h, b1.hostname)
  const bMatch1 = p.match(bReg1)
  if(isBili1 && bMatch1) {
    const v = bMatch1[0]
    if(v) {
      return {
        link: b.replace(x, v),
        otherData: {
          isBilibili: true,
        }
      }
    }
  }

  // 如果是 bilibili player.bilibili.com/player.html 的话
  const b2 = new URL(b)
  const isBili2 = valTool.isInDomain(h, b2.hostname) && p === "/player.html"
  const hasBvid = s.has("bvid")
  if(isBili2 && hasBvid) {
    return {
      link: originUrl,
      otherData: {
        isBilibili: true,
      }
    }
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
      return {
        link: loom.replace(x, v),
        otherData: {
          isLoom: true,
        }
      }
    }
  }

  // 如果是 loom /embed
  const loom2 = new URL(loom)
  const lReg2 = /(?<=\/embed\/)\w{16,48}/g
  const isLoom2 = valTool.isInDomain(h, loom2.hostname)
  const lMatch2 = p.match(lReg2)
  if(isLoom2 && lMatch2) {
    return {
      link: originUrl,
      otherData: {
        isLoom: true,
      }
    }
  }

  // 如果是 Google Docs 的 preview 页，直接返回 原连接
  const gDocs = thirdLink.GOOGLE_DOCS
  const gDocs1 = new URL(gDocs)
  const isGDocs1 = valTool.isInDomain(h, gDocs1.hostname)
  if(isGDocs1) {

    const gDocsRes: EmbedDataRes = {
      link: originUrl,
      otherData: {
        isGDocs: true,
      }
    }

    // document 的情况，通常其路由的 id 部分为 44 个字符
    const gDocsReg1 = /(?<=\/document\/d\/)\w{40,48}(?=\/preview)/g
    const gDocsMatch1 = p.match(gDocsReg1)
    if(gDocsMatch1) return gDocsRes

    // spreadsheets 的情况
    const gDocsReg2 = /(?<=\/spreadsheets\/d\/)\w{40,48}(?=\/preview)/g
    const gDocsMatch2 = p.match(gDocsReg2)
    if(gDocsMatch2) return gDocsRes

    // presentation 的情况
    const gDocsReg3 = /(?<=\/presentation\/d\/)\w{40,48}(?=\/preview)/g
    const gDocsMatch3 = p.match(gDocsReg3)
    if(gDocsMatch3) return gDocsRes

    // form 的情况，id 通常为 56 个字符
    const gDocsReg4 = /\/forms\/d\/e\/\w{50,60}\/viewform/g
    const gDocsMatch4 = p.match(gDocsReg4)
    if(gDocsMatch4) {
      s.delete("usp")
      s.set("embedded", "true")
      gDocsRes.link = url.toString()
      return gDocsRes
    }

  }


  // 如果是 Google Maps 的 embed 页，直接返回原链接
  const gMaps = thirdLink.GOOGLE_MAPS
  const gMaps1 = new URL(gMaps)
  const isGMaps1 = valTool.isInDomain(h, gMaps1.hostname)
  if(isGMaps1) {
    const gMapsRes: EmbedDataRes = {
      link: originUrl,
      otherData: {
        isGMaps: true
      }
    }
    const gMapsReg1 = /\/maps\/embed[\/\?]+/g
    const gMapsMatch1 = originUrl.match(gMapsReg1)
    if(gMapsMatch1) return gMapsRes
  }

  // figma
  const figma = thirdLink.FIGMA_EMBED
  const figma1 = new URL(figma)
  const isFigma = valTool.isInDomain(h, figma1.hostname)
  if(isFigma) {

    const figmaRes: EmbedDataRes = {
      link: originUrl,
      otherData: { isFigma }
    }

    // 如果 参数里有 embed_host=share 就直接返回原链接
    const figmaEmbedHost = s.get("embed_host")
    if(figmaEmbedHost === "share") return figmaRes

    // 将 /file/xxxxxxx 放进 embed 里
    // 通常其 id 在 22 位
    const figmaReg1 = /(?<=\/file\/)\w{12,32}/g
    const figmaMatch1 = p.match(figmaReg1)
    if(figmaMatch1) {
      const v = liuApi.encode_URI_component(originUrl)
      figmaRes.link = figma.replace(x, v)
      return figmaRes
    }

    // 如果直接是 embed 页
    const figmaEmbedPath = `/embed`
    if(p === figmaEmbedPath) {
      return figmaRes
    }
  }

  // hupu
  const hupu = thirdLink.HUPU_BBS
  const hupu1 = new URL(hupu)
  const isHupu = valTool.isInDomain(h, hupu1.hostname)
  if(isHupu) {
    // 路径有具备字数，就代表是详情页
    if(p.length > 6) {
      return {
        link: originUrl,
        otherData: { isHupu }
      }
    }
  }

  // producthunt
  const producthunt = thirdLink.PRODUCTHUNT_CARD
  const producthunt1 = new URL(producthunt)
  const isProductHunt1 = valTool.isInDomain(h, producthunt1.hostname)
  if(isProductHunt1) {
    const idxPH1 = p.indexOf(producthunt1.pathname)
    if(idxPH1 === 0) {
      return {
        link: originUrl,
        otherData: { isProductHunt: true }
      }
    }
  }

  // typeform
  const typeform = thirdLink.TYPEFORM_TO
  const typeform1 = new URL(typeform)
  const isTypeForm1 = valTool.isInDomain(h, typeform1.hostname)
  if(isTypeForm1) {
    // 其 id 大小约 6~8 个字符
    const typeformReg1 = /\/to\/\w{5,12}$/g
    const typeformMatch1 = p.match(typeformReg1)
    if(typeformMatch1) {
      return {
        link: originUrl,
      }
    }
  }

  // spotify
  // 深色模式 theme 等于 0
  const spotify = thirdLink.SPOTIFY_OPEN
  const spotify1 = new URL(spotify)
  const isSpotify = valTool.isInDomain(h, spotify1.hostname)
  if(isSpotify) {
    const spotifyRes: EmbedDataRes = {
      link: "",
      otherData: { isSpotify }
    }

    // 若已是 /embed 页面了
    const isSpotifyEmbed = p.indexOf("/embed/") === 0
    if(isSpotifyEmbed) {
      if(themeVal === "dark") s.set("theme", "0")
      else s.delete("theme")
      spotifyRes.link = url.toString()
      return spotifyRes
    }

    // 单曲 /track，其 id 约在 22 字符左右
    const spotifyReg1 = /(?<=\/track\/)\w{16,32}/g
    const spotifyMatch1 = p.match(spotifyReg1)
    if(spotifyMatch1) {
      const trackId = spotifyMatch1[0]
      spotify1.pathname = `/embed/track/${trackId}`
      if(themeVal === "dark") spotify1.searchParams.set("theme", "0")
      spotifyRes.link = spotify1.toString()
      return spotifyRes
    }


    // 歌单 /playlist
    const spotifyReg2 = /(?<=\/playlist\/)\w{16,32}/g
    const spotifyMatch2 = p.match(spotifyReg2)
    if(spotifyMatch2) {
      const playlistId = spotifyMatch2[0]
      spotify1.pathname = `/embed/playlist/${playlistId}`
      if(themeVal === "dark") spotify1.searchParams.set("theme", "0")
      spotifyRes.link = spotify1.toString()
      return spotifyRes
    }

    // 专辑 /playlist
    const spotifyReg3 = /(?<=\/album\/)\w{16,32}/g
    const spotifyMatch3 = p.match(spotifyReg3)
    if(spotifyMatch3) {
      const albumId = spotifyMatch3[0]
      spotify1.pathname = `/embed/album/${albumId}`
      if(themeVal === "dark") spotify1.searchParams.set("theme", "0")
      spotifyRes.link = spotify1.toString()
      return spotifyRes
    }
    
  }


  // apple music
  const apMusic = new URL(thirdLink.APPLE_MUSIC)
  const apMusicEmbed = new URL(thirdLink.APPLE_MUSIC_EMBED)
  const isAppleMusic = valTool.isInDomain(h, apMusic.hostname)
  if(isAppleMusic) {
    const apMusicRes: EmbedDataRes = {
      link: originUrl,
      otherData: { isAppleMusic }
    }
    const hasApMusicEmbed = valTool.isInDomain(h, apMusicEmbed.hostname)
    if(hasApMusicEmbed) return apMusicRes

    // [\w\-]{2,6} 匹配地区码   
    // [^\s\/]+ 匹配专辑名称   
    // \d{6,16} 匹配专辑 id
    const apMusicReg1 = /\/[\w\-]{2,6}\/album\/[^\s\/]+\/\d{6,16}/g
    const apMusicMatch1 = p.match(apMusicReg1)
    if(apMusicMatch1) {
      url.hostname = apMusicEmbed.hostname
      apMusicRes.link = url.toString()
      return apMusicRes
    }
  }

  // apple podcast
  const apPodcast = new URL(thirdLink.APPLE_PODCAST)
  const apPodcastEmbed = new URL(thirdLink.APPLE_PODCAST_EMBED)
  const isApplePodcast = valTool.isInDomain(h, apPodcast.hostname)
  if(isApplePodcast) {
    const apPodcastRes: EmbedDataRes = {
      link: originUrl,
      otherData: { isApplePodcast }
    }
    const hasApPodcastEmbed = valTool.isInDomain(h, apPodcastEmbed.hostname)
    if(hasApPodcastEmbed) return apPodcastRes

    // [\w\-]{2,6} 匹配地区码
    // [^\s\/]+ 匹配单集名称  
    // id\d{6,16} 匹配播客id
    const apPodcastReg1 = /\/[\w\-]{2,6}\/podcast\/[^\s\/]+\/id\d{6,16}/g
    const apPodcastMatch1 = p.match(apPodcastReg1)
    if(apPodcastMatch1) {
      url.hostname = apPodcastEmbed.hostname
      apPodcastRes.link = url.toString()
      return apPodcastRes
    }
  }

  // Word 嵌入（来自 OneDrive 的域名）
  const onedriveEmbed = new URL(thirdLink.ONEDRIVE_EMBED)
  const isOneDrive = valTool.isInDomain(h, onedriveEmbed.hostname)
  if(isOneDrive) {
    const onedriveRes: EmbedDataRes = {
      link: originUrl,
    }
    if(p === onedriveEmbed.pathname) {
      return onedriveRes
    }
  }

  // code
  const coda = new URL(thirdLink.CODA_IO)
  const isCoda = valTool.isInDomain(h, coda.hostname)
  if(isCoda) {
    const codaRes: EmbedDataRes = {
      link: originUrl,
      otherData: { isCoda }
    }
    const codaReg1 = /(?<=\/embed\/)\w{5,16}\/\w{3,9}/g
    const codaMatch1 = p.match(codaReg1)
    if(codaMatch1) return codaRes

    const codaReg2 = /(?<=\/d\/)\w{5,16}\/\w{3,9}/g
    const codaMatch2 = p.match(codaReg2)
    if(codaMatch2) {
      let codaId = codaMatch2[0]

      // coda 分享链接里的 _d 要去掉才能变成嵌入链接
      const _firstTwoCodaId = codaId.substring(0, 2)
      if(_firstTwoCodaId === "_d") {
        codaId = codaId.substring(2)
      }
      url.pathname = `/embed/${codaId}`
      codaRes.link = url.toString()
      return codaRes
    }
  }


  // mastodon
  for(let i=0; i<mastodonDomains.length; i++) {
    const v = mastodonDomains[i]
    const mastodon = new URL(`https://${v}`)
    const isMastodon = valTool.isInDomain(h, mastodon.hostname)
    if(!isMastodon) continue

    const mstnRes: EmbedDataRes = {
      link: originUrl,
      otherData: { isMastodon }
    }

    // 只能解析当前域名的内容，跨站点的无法在 iframe 里展示
    // 另外，跨站点的相同内容，id 也是不一样的
    // \w 表示用户 handle，\d 为内容 id 通常为 18 位
    // 最后的 ? 表示匹配 / 字符 0 次或 1 次
    // 最后的 $ 表示匹配结尾
    const mstnReg1 = /^\/@\w{2,32}\/\d{3,32}\/?$/g
    const mstnMatch1 = p.match(mstnReg1)
    if(mstnMatch1) {
      if(!originUrl.endsWith("/")) {
        originUrl = originUrl + "/"
      }
      if(!originUrl.endsWith("embed")) {
        originUrl = originUrl + ("embed")
      }
      mstnRes.link = originUrl
      return mstnRes
    }
    
    break
  }

  return
}