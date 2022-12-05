import { ref, watch } from "vue";
import type { Ref } from "vue";
import type { LocationQuery, RouteLocationNormalizedLoaded } from "vue-router";
import { useRouteAndLiuRouter } from '../../../../routes/liu-router';

const GOOGLE_SEARCH = "https://www.google.com/?igu=1"
const SOUGO_SEARCH = "https://m.sogou.com/"
const CHAT_GPT3 = "https://chat.openai.com/chat"

export function useViceContent() {
  const iframeSrc = ref("")
  const iframeEl = ref<HTMLIFrameElement | null>(null)
  const { route, router } = useRouteAndLiuRouter()

  listenRouteChange(iframeSrc, route)
  const onTapBack = () => {
    router.back()
  }

  return { iframeSrc, iframeEl, onTapBack }
}


function listenRouteChange(
  iframeSrc: Ref<string>, 
  route: RouteLocationNormalizedLoaded
) {

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
    const { outq, gpt3 } = newQuery

    if(outq && typeof outq === "string") {
      openGoogleSerach(outq)
    }
    else if(gpt3 && typeof gpt3 === "string") {
      openChatGPT(gpt3)
    }

  }

  watch(() => route.query, (newQuery) => {
    checkRouteChange(newQuery)
  })

  checkRouteChange(route.query)
}