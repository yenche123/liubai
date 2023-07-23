import { onActivated, watch, reactive } from "vue";
import type { LocationQuery } from "vue-router";
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import valTool from "~/utils/basic/val-tool";
import liuApi from "~/utils/liu-api";
import type { VcState, VcCtx, VcData, VcThirdParty } from "./types"
import thirdLink from "~/config/third-link";
import liuUtil from "~/utils/liu-util";
import { useVvLinkStore } from "~/hooks/stores/useVvLinkStore";
import liuEnv from "~/utils/liu-env";

export function useViceContent() {
  const { route, router } = useRouteAndLiuRouter()
  const vStore = useVvLinkStore()

  const vcData = reactive<VcData>({
    list: [],
    currentState: "",
    currentId: "",
  })

  const ctx: VcCtx = {
    route,
    router,
    vcData,
  }

  listenRouteChange(ctx)
  const onTapBack = () => {
    router.naviBack()
  }

  const onTapClose = async () => {
    const newQuery = liuUtil.getDefaultRouteQuery(route)
    router.replaceWithNewQuery(route, newQuery)
    await valTool.waitMilli(300)
    closeAllView(ctx, true)
  }

  const onTapOpenInNew = () => {
    let url: URL | undefined
    const vs = vcData.currentState
    const id = vcData.currentId
    const q = route.query

    if(q.pdf && typeof q.pdf === "string") {
      window.open(q.pdf, "_blank")
      return
    }
    else if(vs === "iframe" && id) {
      url = vStore.getOriginURL(id)
    }
    else if(vs === "third" && id) {
      url = vStore.getOriginURL(id)
    }
    else if(vs === "thread" && id) {
      const u = router.resolve({ name: "detail", params: { contentId: id } })
      url = new URL(u.fullPath, location.origin)
    }
    
    if(!url) return
    const tmp = url.toString()
    window.open(tmp, "_blank")
  }

  return {
    vcData,
    onTapBack,
    onTapClose,
    onTapOpenInNew,
  }
}


function listenRouteChange(
  ctx: VcCtx,
) {
  const _env = liuEnv.getEnv()
  let located = ""
  const { route } = ctx

  const setNewIframeSrc = (val: string, otherData?: Record<string, any>) => {
    showView(ctx, "iframe", val, undefined, otherData)
  }

  const setNewThirdParty = (val: string, thirdParty: VcThirdParty) => {
    showView(ctx, "third", val, thirdParty)
  }

  const openChatGPT = (q: string) => {
    setNewIframeSrc(thirdLink.CHAT_GPT)
  }

  const openPDF = (q: string) => {
    const f = liuApi.encode_URI_component(q)
    const url = `/lib/pdf-js/web/viewer.html?file=${f}`
    setNewIframeSrc(url)
  }

  const openSougoSearch = (q: string) => {
    const url = new URL(thirdLink.SOUGO_SEARCH)
    url.searchParams.append("keyword", q)
    setNewIframeSrc(url.toString())
  }

  const openBingSearch = (q: string) => {
    const url = liuUtil.open.getBingSearchLink(q)
    setNewIframeSrc(url)
  }

  const openGoogleSerach = (q: string) => {
    const url = new URL(thirdLink.GOOGLE_SEARCH)
    url.pathname = "/search"
    url.searchParams.append("q", q)
    setNewIframeSrc(url.toString())
  }

  const openXhsSearch = (name: string) => {
    const url = liuUtil.open.getXhsSearchLink(name)
    setNewIframeSrc(url)
  }

  const openGithubSearch = (q: string) => {
    const url = liuUtil.open.getGithubSearchLink(q)
    setNewIframeSrc(url)
  }

  const whenNoMatch = async () => {
    await valTool.waitMilli(350)
    if(liuUtil.needToOpenViceView(route.query)) {
      return
    }
    closeAllView(ctx)
  }

  const tryToOpenLink = () => {
    const vStore = useVvLinkStore()
    let url = vStore.getCurrentLink(route)
    if(!url) {
      ctx.router.naviBackUntilNoSpecificQuery(route, "vlink")
      return 
    }

    const thirdParty = vStore.isSpecialLink(url)
    if(thirdParty) {
      setNewThirdParty(url, thirdParty)
      return
    }

    const iframeProxy = _env.IFRAME_PROXY
    const inAllowList = vStore.isInAllowedList(url)
    const embedUrl = vStore.getEmbedData(url)
    if(embedUrl) url = embedUrl.link
    else if(iframeProxy && !inAllowList) {
      url = iframeProxy + url
    }

    // console.log("iframe url: ")
    // console.log(url)
    // console.log(" ")
    setNewIframeSrc(url, embedUrl?.otherData)
  }
  
  const checkRouteChange = (newQuery: LocationQuery) => {
    const { 
      outq,
      cid, 
      cid2,
      pdf, 
      xhs, 
      github, 
      bing, 
      vlink,
    } = newQuery

    if(outq && typeof outq === "string") {
      // openGoogleSerach(outq)
      openBingSearch(outq)
    }
    else if(bing && typeof bing === "string") {
      openBingSearch(bing)
    }
    else if(pdf && typeof pdf === "string") {
      openPDF(pdf)
    }
    else if(xhs && typeof xhs === "string") {
      openXhsSearch(xhs)
    }
    else if(github && typeof github === "string") {
      openGithubSearch(github)
    }
    else if(cid && typeof cid === "string") {
      showView(ctx, "thread", cid)
    }
    else if(cid2 && typeof cid2 === "string") {
      showView(ctx, "comment", cid2)
    }
    else if(vlink && typeof vlink === "string") {
      tryToOpenLink()
    }
    else {
      whenNoMatch()
    }
  }

  watch(() => route.query, (newQuery) => {
    if(located === route.name) {
      checkRouteChange(newQuery)
    }
  })

  onActivated(() => {
    if(located) return
    if(typeof route.name === "string") {
      located = route.name
    }
    checkRouteChange(route.query)
  })
}


function showView(
  ctx: VcCtx,
  state: VcState, 
  id: string,
  thirdParty?: VcThirdParty,
  otherData?: Record<string, any>
) {
  const vcData = ctx.vcData
  const { list } = vcData
  const newData = {
    state,
    id,
    show: true,
    thirdParty,
    otherData,
  }
  liuUtil.view.showView(list, newData, "state", state)
  vcData.currentState = state
  vcData.currentId = id
}

function closeAllView(
  ctx: VcCtx,
  clearly: boolean = false,    // 完全清除
) {
  const list = ctx.vcData.list
  
  if(clearly) {
    ctx.vcData.list = []
  }
  else {
    for(let i=0; i<list.length; i++) {
      const v = list[i]

      // 发现是 yt / bilibili 的视频时，直接销毁
      // 要不然视频会一直在后台播放
      let isVideo = v.otherData?.isYouTube
      if(!isVideo) isVideo = v.otherData?.isBilibili

      if(isVideo) {
        list.splice(i, 1)
        i--
        continue
      }
      
      v.show = false
    }
  }
  
  ctx.vcData.currentState = ""
  ctx.vcData.currentId = ""
}