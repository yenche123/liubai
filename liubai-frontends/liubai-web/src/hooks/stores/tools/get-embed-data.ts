import thirdLink from "~/config/third-link"
import valTool from "~/utils/basic/val-tool"
import liuApi from "~/utils/liu-api"
import { mastodonDomains } from "~/config/domain-list"
import { useSystemStore } from "../useSystemStore"

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

  const { supported_theme: themeVal } = useSystemStore()
  let tmp: string = ""

  // 适配 youtube /watch
  const yt = thirdLink.YOUTUBE_EMBED
  const yt0 = new URL(yt)
  const yt1 = new URL(thirdLink.YOUTUBE_WATCH)
  const ytRes: EmbedDataRes = { link: originUrl, otherData: { isYouTube: true } }
  let isYouTube1 = valTool.isInDomain(h, yt1.hostname) && p === "/watch"
  if(isYouTube1) {
    const v = s.get("v")
    let sec = s.get("t")
    if(sec && sec.length > 0) {
      // 把尾巴的 s 字符拿掉
      if(sec[sec.length - 1] === "s") {
        sec = sec.substring(0, sec.length - 1)
      }
      yt0.searchParams.set("start", sec)
    }
    if(v) {
      yt0.pathname = `/embed/${v}`
      ytRes.link = yt0.toString()
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
  const ytReg3 = /\/embed\/\w{5,16}/g
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
  const bReg1 = /\/video\/\w{5,16}/g
  const isBili1 = valTool.isInDomain(h, b1.hostname)
  const bMatch1 = p.match(bReg1)
  if(isBili1 && bMatch1) {
    const v = bMatch1[0]?.substring(7)
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

  // reddit embed
  const redditEmbed = new URL(thirdLink.REDDIT_EMBED)
  const isRedditEmbed = valTool.isInDomain(h, redditEmbed.hostname)
  if(isRedditEmbed) {
    return {
      link: originUrl,
      otherData: { isReddit: true },
    }
  }

  // reddit.com
  const reddit = new URL(thirdLink.REDDIT_COM)
  const isReddit = valTool.isInDomain(h, reddit.hostname)
  if(isReddit && p.startsWith("/r/")) {
    url.hostname = redditEmbed.hostname
    return {
      link: url.toString(),
      otherData: { isReddit: true },
    }
  }

  // 适配 loom /share
  const loom = thirdLink.LOOM_EMBED
  const loom1 = new URL(thirdLink.LOOM_SHARE)
  const lReg1 = /\/share\/\w{16,48}/g
  const isLoom1 = valTool.isInDomain(h, loom1.hostname)
  const lMatch1 = p.match(lReg1)
  if(isLoom1 && lMatch1) {
    const v = lMatch1[0]?.substring(7)
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
  const lReg2 = /\/embed\/\w{16,48}/g
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
    const gDocsReg1 = /\/document\/d\/\w{40,48}(?=\/preview)/g
    const gDocsMatch1 = p.match(gDocsReg1)
    if(gDocsMatch1) return gDocsRes

    // spreadsheets 的情况
    const gDocsReg2 = /\/spreadsheets\/d\/\w{40,48}(?=\/preview)/g
    const gDocsMatch2 = p.match(gDocsReg2)
    if(gDocsMatch2) return gDocsRes

    // presentation 的情况
    const gDocsReg3 = /\/presentation\/d\/\w{40,48}(?=\/preview)/g
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
  const gMaps1 = new URL(thirdLink.GOOGLE_MAPS)
  const isGMaps1 = valTool.isInDomain(h, gMaps1.hostname) && p.startsWith("/maps")
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
    const figmaReg1 = /\/file\/\w{12,32}/g
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
    const spotifyReg1 = /\/track\/\w{16,32}/g
    const spotifyMatch1 = p.match(spotifyReg1)
    if(spotifyMatch1) {
      const trackId = spotifyMatch1[0]?.substring(7)
      spotify1.pathname = `/embed/track/${trackId}`
    }


    // 歌单 /playlist
    const spotifyReg2 = /\/playlist\/\w{16,32}/g
    const spotifyMatch2 = p.match(spotifyReg2)
    if(spotifyMatch2) {
      const playlistId = spotifyMatch2[0]?.substring(10)
      spotify1.pathname = `/embed/playlist/${playlistId}`
    }

    // 专辑 /playlist
    const spotifyReg3 = /\/album\/\w{16,32}/g
    const spotifyMatch3 = p.match(spotifyReg3)
    if(spotifyMatch3) {
      const albumId = spotifyMatch3[0]?.substring(7)
      spotify1.pathname = `/embed/album/${albumId}`
    }

    // 艺人
    const spotifyReg4 = /\/artist\/\w{16,32}/g
    const spotifyMatch4 = p.match(spotifyReg4)
    if(spotifyMatch4) {
      const artistId = spotifyMatch4[0]?.substring(8)
      spotify1.pathname = `/embed/artist/${artistId}`
    }

    // 当 spotify1 的 pathname 不止是 “/” 时，代表已找到目标了
    if(spotify1.pathname.length > 10) {
      if(themeVal === 'dark') spotify1.searchParams.set("theme", "0")
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

  // coda
  const coda = new URL(thirdLink.CODA_IO)
  const isCoda = valTool.isInDomain(h, coda.hostname)
  if(isCoda) {
    const codaRes: EmbedDataRes = {
      link: originUrl,
      otherData: { isCoda }
    }
    const codaReg1 = /\/embed\/\w{5,16}\/\w{3,9}/g
    const codaMatch1 = p.match(codaReg1)
    if(codaMatch1) return codaRes

    const codaReg2 = /\/d\/\w{5,16}\/\w{3,9}/g
    const codaMatch2 = p.match(codaReg2)
    if(codaMatch2) {
      let codaId = codaMatch2[0]?.substring(3)

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

  // fireside
  const firesideShare = new URL(thirdLink.FIRESIDE_SHARE)
  const firesidePlayer = new URL(thirdLink.FIRESIDE_PLAYER)
  const isFireside1 = valTool.isInDomain(h, firesideShare.hostname)
  if(isFireside1) {
    const firesideReg1 = /\/episode\/[\w\-\+]{16,32}/g
    const firesideMatch1 = p.match(firesideReg1)
    if(firesideMatch1) {
      const firesideId = firesideMatch1[0]?.substring(9)
      firesidePlayer.pathname += firesideId
      firesidePlayer.searchParams.set("theme", themeVal)
      return { link: firesidePlayer.toString() }
    }
  }

  // street voice
  const streetVoice = new URL(thirdLink.STREET_VOICE)
  const isStreetVoice = valTool.isInDomain(h, streetVoice.hostname)
  if(isStreetVoice) {
    const streetVoiceRes: EmbedDataRes = {
      link: originUrl,
      otherData: { isStreetVoice }
    }

    const streetVoiceReg1 = /\/music\/embed\//g
    const streetVoiceMatch1 = p.match(streetVoiceReg1)
    if(streetVoiceMatch1) return streetVoiceRes

    const streetVoiceReg2 = /\/\w{2,20}\/songs\/\d{2,9}/g
    const streetVoiceReg3 = /\/songs\/\d{2,9}/g
    const streetVoiceMatch2 = p.match(streetVoiceReg2)
    if(streetVoiceMatch2) {
      const streetVoicePath2 = streetVoiceMatch2[0] ?? ""
      const streetVoiceMatch3 = streetVoicePath2.match(streetVoiceReg3)
      if(streetVoiceMatch3) {
        const songId = streetVoiceMatch3[0]?.substring(7)
        streetVoice.pathname = `/music/embed/`
        streetVoice.searchParams.set("id", songId)
        streetVoice.searchParams.set("s", "l")
        streetVoiceRes.link = streetVoice.toString()
        return streetVoiceRes
      }
    }
  }

  // vimeo
  const vimeo = new URL(thirdLink.VIMEO_COM)
  const vimeo2 = new URL(thirdLink.VIMEO_PLAYER)
  const isVimeo2 = valTool.isInDomain(h, vimeo2.hostname)
  if(isVimeo2) {
    return { link: originUrl, otherData: { isVimeo: true } }
  }
  const isVimeo = valTool.isInDomain(h, vimeo.hostname)
  if(isVimeo) {
    // 通常是 9 位数的 id
    const vimeoReg1 = /\/\d{2,12}/g
    const vimeoMatch1 = p.match(vimeoReg1)
    if(vimeoMatch1) {
      const vimeoId = vimeoMatch1[0]?.substring(1)
      vimeo2.pathname = `/video/${vimeoId}`
      return { link: vimeo2.toString(), otherData: { isVimeo: true } }
    }
  }

  // simplecast
  const simplecast = new URL(thirdLink.SIMPLECAST_PLAYER)
  const isSimplecast = valTool.isInDomain(h, simplecast.hostname)
  if(isSimplecast) {
    if(themeVal === "light") s.set("dark", "false")
    else if(themeVal === "dark") s.set("dark", "true")

    return { link: url.toString(), otherData: { isSimplecast } }
  }

  // xigua
  const xigua = new URL(thirdLink.XIGUA_COM)
  const isXigua = valTool.isInDomain(h, xigua.hostname)
  if(isXigua) {
    const xiguaRes: EmbedDataRes = {
      link: originUrl,
      otherData: { isXigua },
    }
    if(p.startsWith("/iframe/")) {
      return xiguaRes
    }
    // 其 id 通常为 19 位数
    const xiguaReg1 = /\/\d{17,32}/g
    const xiguaMatch1 = p.match(xiguaReg1)
    if(xiguaMatch1) {
      const xiguaId1 = xiguaMatch1[0]?.substring(1)
      const xiguaId2 = s.get("id")
      xigua.pathname = `/iframe/` + (xiguaId2 ? xiguaId2 : xiguaId1)
      xigua.searchParams.set("autoplay", "1")
      xiguaRes.link = xigua.toString()
      return xiguaRes
    }
  }

  // LinkedIn
  const linkedin = new URL(thirdLink.LINKEDIN_EMBED)
  const isLinkedIn = valTool.isInDomain(h, linkedin.hostname)
  if(isLinkedIn) {
    const linkedinRes: EmbedDataRes = {
      link: originUrl,
      otherData: { isLinkedIn }
    }

    // 是否已经为 embed 的链接
    const isLinkedInEmbed = p.startsWith(linkedin.pathname)
    if(isLinkedInEmbed) return linkedinRes

    // 将路径为 /feed/update 转为 /embed/feed/update
    const isFeedUpdate = p.startsWith("/feed/update")
    if(isFeedUpdate) {
      url.pathname = `/embed` + p
      linkedinRes.link = url.toString()
      return linkedinRes
    }
    
  }


  // vika
  const vika = new URL(thirdLink.VIKA_SHARE)
  const isVika = valTool.isInDomain(h, vika.hostname) && p.startsWith(vika.pathname)
  if(isVika) {
    return { link: originUrl, otherData: { isVika } }
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