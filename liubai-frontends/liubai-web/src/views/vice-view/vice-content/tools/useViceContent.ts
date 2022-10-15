import { ref, watch } from "vue";
import type { Ref } from "vue";
import type { LocationQuery, RouteLocationNormalizedLoaded } from "vue-router";
import { useRouteAndLiuRouter } from '../../../../routes/liu-router';

const GOOGLE_SEARCH = "https://www.google.com/?igu=1"
const SOUGO_SEARCH = "https://m.sogou.com/"

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


function listenRouteChange(iframeSrc: Ref<string>, route: RouteLocationNormalizedLoaded) {
  
  const checkRouteChange = (newQuery: LocationQuery) => {
    const url = new URL(GOOGLE_SEARCH)
    const url2 = new URL(SOUGO_SEARCH)
    const outq = newQuery.outq

    if(!outq || typeof outq !== "string") {
      iframeSrc.value = GOOGLE_SEARCH
      return
    }

    url.pathname = "/search"
    url2.pathname = "/web/searchList.jsp"

    url.searchParams.append("q", outq)
    url2.searchParams.append("keyword", outq)

    iframeSrc.value = url.toString()
  }

  watch(() => route.query, (newQuery) => {
    checkRouteChange(newQuery)
  })

  checkRouteChange(route.query)
}