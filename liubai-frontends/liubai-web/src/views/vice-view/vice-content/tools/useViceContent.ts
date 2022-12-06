import { ref, watch } from "vue";
import type { Ref } from "vue";
import type { LocationQuery, RouteLocationNormalizedLoaded } from "vue-router";
import { useRouteAndLiuRouter } from '../../../../routes/liu-router';

const GOOGLE_SEARCH = "https://www.google.com/?igu=1"
const SOUGO_SEARCH = "https://m.sogou.com/"
const CHAT_GPT3 = "https://chat.openai.com/chat"

export type VcState = "thread" | "iframe" | ""

interface VcCtx {
  iframeSrc: Ref<string>
  route: RouteLocationNormalizedLoaded
  vcState: Ref<VcState>
  cid: Ref<string>
}

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
    if(!iframeSrc.value) return
    const url = new URL(iframeSrc.value)
    const query = url.searchParams
    if(query.has("igu")) {
      query.delete("igu")
    }

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
  const { iframeSrc, vcState, route, cid: cidRef } = ctx

  const openChatGPT = (q: string) => {
    iframeSrc.value = CHAT_GPT3
  }

  const openGougoSearch = (q: string) => {
    const url = new URL(SOUGO_SEARCH)
    url.pathname = "/web/searchList.jsp"
    url.searchParams.append("keyword", q)
    iframeSrc.value = url.toString()
  }

  const openGoogleSerach = (q: string) => {
    const url = new URL(GOOGLE_SEARCH)
    url.pathname = "/search"
    url.searchParams.append("q", q)
    iframeSrc.value = url.toString()
  }
  
  const checkRouteChange = (newQuery: LocationQuery) => {
    const { outq, gpt3, cid } = newQuery

    if(outq && typeof outq === "string") {
      vcState.value = "iframe"
      openGoogleSerach(outq)
    }
    else if(gpt3 && typeof gpt3 === "string") {
      vcState.value = "iframe"
      openChatGPT(gpt3)
    }
    else if(cid && typeof cid === "string") {
      vcState.value = "thread"
      cidRef.value = cid
    }
  }

  watch(() => route.query, (newQuery) => {
    checkRouteChange(newQuery)
  })

  checkRouteChange(route.query)
}