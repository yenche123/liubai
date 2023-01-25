import { onMounted, onUnmounted, ref } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import localCache from "~/utils/system/local-cache"

export function useVcIframe() {
  const { route } = useRouteAndLiuRouter()
  const iframeEl = ref<HTMLIFrameElement | null>(null)

  const whenWebViewerLoaded = () => {
    const iframeVal = iframeEl.value
    const localPf = localCache.getLocalPreference()
    const localTheme = localPf.theme

    if(!localTheme || localTheme === "system") return
    const viewerCssTheme = localTheme === "dark" ? 2 : 1
    if(!iframeVal) return
    if(!route.query.pdf) return

    try {
      const iframeWindow = iframeVal.contentWindow as any
      if(!iframeWindow) return
      iframeWindow.PDFViewerApplicationOptions.set("disablePreferences", true)
      iframeWindow.PDFViewerApplicationOptions.set("viewerCssTheme", viewerCssTheme)
      iframeWindow.PDFViewerApplication._forceCssTheme()
    }
    catch(err) {
      console.log("err: ")
      console.log(err)
    }

  }

  onMounted(() => {
    window.addEventListener("webviewerloaded", whenWebViewerLoaded)
  })

  onUnmounted(() => {
    window.removeEventListener("webviewerloaded", whenWebViewerLoaded)
  })

  return {
    iframeEl,
  }
}