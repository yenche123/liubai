import { ref, watch } from "vue";
import type { Ref } from "vue";
import type { LocationQuery } from "vue-router";
import { useRouteAndLiuRouter } from '../../../../routes/liu-router';

const GOOGLE_SEARCH = "https://www.google.com/?igu=1"

export function useViceContent() {
  const iframeSrc = ref("")

  listenRouteChange(iframeSrc)

  return { iframeSrc }
}


function listenRouteChange(iframeSrc: Ref<string>) {
  const { route } = useRouteAndLiuRouter()

  const checkRouteChange = (newQuery: LocationQuery) => {
    const url = new URL(GOOGLE_SEARCH)
    const outq = newQuery.outq

    if(!outq || typeof outq !== "string") {
      iframeSrc.value = GOOGLE_SEARCH
      return
    }

    url.pathname = "/search"
    const searchParams = url.searchParams
    searchParams.append("q", outq)
    iframeSrc.value = url.toString()
  }

  watch(() => route.query, (newQuery) => {
    checkRouteChange(newQuery)
  })

  checkRouteChange(route.query)
}