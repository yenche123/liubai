import { onMounted, onUnmounted, ref } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import localCache from "~/utils/system/local-cache"

export function useVcIframe() {
  const { route } = useRouteAndLiuRouter()
  const iframeEl = ref<HTMLIFrameElement | null>(null)

  const whenWebViewerLoaded = () => {
    const iframeVal = iframeEl.value
    
    if(!iframeVal) return
    if(!route.query.pdf) return


    let iframeWindow: any

    try {
      iframeWindow = iframeVal.contentWindow as any
    }
    catch(err) {
      console.log("iframeVal.contentWindow err: ")
      console.log(err)
      return
    }
    if(!iframeWindow) return
    
    iframeWindow.addEventListener("error", (event: any) => {
      console.log("iframeWindow 捕获到错误...........")
      console.log(event)
      console.log(" ")
    })

    const localPf = localCache.getLocalPreference()
    const localTheme = localPf.theme
    if(!localTheme || localTheme === "system") return
    const viewerCssTheme = localTheme === "dark" ? 2 : 1
    
    iframeWindow.PDFViewerApplicationOptions.set("disablePreferences", true)
    iframeWindow.PDFViewerApplicationOptions.set("viewerCssTheme", viewerCssTheme)
    iframeWindow.PDFViewerApplication._forceCssTheme()
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