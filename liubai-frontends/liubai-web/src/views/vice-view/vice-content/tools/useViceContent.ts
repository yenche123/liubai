import { onActivated, ref, watch } from "vue";
import type { LocationQuery } from "vue-router";
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import valTool from "~/utils/basic/val-tool";
import liuApi from "~/utils/liu-api";
import type { VcState, VcCtx } from "./types"
import thirdLink from "~/config/third-link";
import liuUtil from "~/utils/liu-util";

export function useViceContent() {
  const iframeSrc = ref("")
  const vcState = ref<VcState>("")
  const cid = ref("")
  const { route, router } = useRouteAndLiuRouter()

  const ctx = {
    iframeSrc,
    route,
    vcState,
    cid,
  }

  listenRouteChange(ctx)
  const onTapBack = () => {
    router.back()
  }

  const onTapClose = () => {
    router.pushCurrentNoQuery(route)
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
      url = new URL(iframeSrc.value)
      const query = url.searchParams
      if(query.has("igu")) {
        query.delete("igu")
      }
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
    if(val === iframeSrc.value) {
      return
    }
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

  const openGougoSearch = (q: string) => {
    const url = new URL(thirdLink.SOUGO_SEARCH)
    url.searchParams.append("keyword", q)
    setNewIframeSrc(url.toString())
  }

  const openBingSearch = (q: string) => {
    const url = liuUtil.open.getXhsSearchLink(q)
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
    if(iframeSrc.value) {
      iframeSrc.value = ""
    }
    vcState.value = ""
  }
  
  const checkRouteChange = (newQuery: LocationQuery) => {
    const { outq, gpt3, cid, pdf, xhs, github, bing } = newQuery

    if(outq && typeof outq === "string") {
      vcState.value = "iframe"
      // openGoogleSerach(outq)
      openBingSearch(outq)
    }
    if(bing && typeof bing === "string") {
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