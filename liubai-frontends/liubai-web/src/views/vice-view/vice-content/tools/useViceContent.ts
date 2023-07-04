import { onActivated, ref, watch } from "vue";
import type { LocationQuery } from "vue-router";
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import valTool from "~/utils/basic/val-tool";
import liuApi from "~/utils/liu-api";
import type { VcState, VcCtx } from "./types"
import thirdLink from "~/config/third-link";
import liuUtil from "~/utils/liu-util";
import { useVvLinkStore } from "~/hooks/stores/useVvLinkStore";
import liuEnv from "~/utils/liu-env";

export function useViceContent() {
  const iframeSrc = ref("")
  const vcState = ref<VcState>("")
  const cid = ref("")     // 表示 thread-id
  const { route, router } = useRouteAndLiuRouter()
  const vStore = useVvLinkStore()

  const ctx: VcCtx = {
    iframeSrc,
    route,
    router,
    vcState,
    cid,
  }

  listenRouteChange(ctx)
  const onTapBack = () => {
    router.naviBack()
  }

  const onTapClose = async () => {
    const newQuery = liuUtil.getDefaultRouteQuery(route)
    router.replaceWithNewQuery(route, newQuery)
  }

  const onTapOpenInNew = () => {
    let url: URL | undefined
    const vs = vcState.value
    const q = route.query

    if(q.pdf && typeof q.pdf === "string") {
      window.open(q.pdf, "_blank")
      return
    }
    else if(vs === "iframe" && iframeSrc.value) {
      url = vStore.getOriginURL(iframeSrc.value)
    }
    else if(vs === "thread" && cid.value) {
      const u = router.resolve({ name: "detail", params: { contentId: cid.value } })
      url = new URL(u.fullPath, location.origin)
    }
    
    if(!url) return
    const tmp = url.toString()
    window.open(tmp, "_blank")
  }

  return {
    cid,
    vcState,
    iframeSrc,
    onTapBack,
    onTapClose,
    onTapOpenInNew,
  }
}


function listenRouteChange(
  ctx: VcCtx,
) {
  let located = ""
  const { iframeSrc, vcState, route, cid: cidRef } = ctx

  const setNewIframeSrc = (val: string) => {
    if(val === iframeSrc.value) return
    iframeSrc.value = val
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
    if(!vcState.value) return
    await valTool.waitMilli(350)
    if(liuUtil.needToOpenViceView(route.query)) {
      return
    }
    if(iframeSrc.value) {
      iframeSrc.value = ""
    }
    vcState.value = ""
  }

  const tryToOpenLink = () => {
    const vStore = useVvLinkStore()
    let url = vStore.getCurrentLink(route)
    if(!url) {
      ctx.router.naviBackUntilNoSpecificQuery(route, "vlink")
      return 
    }

    const iframeProxy = liuEnv.getEnv().IFRAME_PROXY
    const inAllowList = vStore.isInAllowedList(url)
    const embedUrl = vStore.getEmbedUrlStr(url)
    if(embedUrl) url = embedUrl
    else if(iframeProxy && !inAllowList) {
      url = iframeProxy + url
    }

    console.log("iframe url: ")
    console.log(url)
    console.log(" ")
    setNewIframeSrc(url)
  }
  
  const checkRouteChange = (newQuery: LocationQuery) => {
    const { outq, gpt3, cid, pdf, xhs, github, bing, vlink } = newQuery

    if(outq && typeof outq === "string") {
      vcState.value = "iframe"
      // openGoogleSerach(outq)
      openBingSearch(outq)
    }
    else if(bing && typeof bing === "string") {
      vcState.value = "iframe"
      openBingSearch(bing)
    }
    else if(pdf && typeof pdf === "string") {
      vcState.value = "iframe"
      openPDF(pdf)
    }
    else if(gpt3 && typeof gpt3 === "string") {
      vcState.value = "iframe"
      openChatGPT(gpt3)
    }
    else if(xhs && typeof xhs === "string") {
      vcState.value = "iframe"
      openXhsSearch(xhs)
    }
    else if(github && typeof github === "string") {
      vcState.value = "iframe"
      openGithubSearch(github)
    }
    else if(cid && typeof cid === "string") {
      vcState.value = "thread"
      cidRef.value = cid
    }
    else if(vlink && typeof vlink === "string") {
      vcState.value = "iframe"
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