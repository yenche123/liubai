import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import liuApi from "~/utils/liu-api"
import localCache from "~/utils/system/local-cache"
import type { VciProps } from "./types"
import thirdLink from "~/config/third-link"
import valTool from "~/utils/basic/val-tool"

export function useVcIframe(props: VciProps) {
  const { route } = useRouteAndLiuRouter()
  const iframeEl = ref<HTMLIFrameElement | null>(null)
  const { bgColor } = getBgColor(props)

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
    const newTheme = localTheme === "auto" ? liuApi.getThemeFromTime() : localTheme
    const viewerCssTheme = newTheme === "dark" ? 2 : 1
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
    bgColor,
  }
}


function getBgColor(props: VciProps) {
  const bgColor = computed<string | undefined>(() => {
    const src = props.iframeSrc
    if(!src) return

    const WHITE_BG = `#fff`
    let url: URL
    try {
      url = new URL(src)
    }
    catch(err) {
      return
    }

    // zhiy.cc 时添加背景白色
    const zhiycc = new URL(thirdLink.ZHIY_CC)
    const isZhiycc = valTool.isInDomain(url.hostname, zhiycc.hostname)
    if(isZhiycc) {
      return WHITE_BG
    }
    return undefined
  })

  return { bgColor }
}