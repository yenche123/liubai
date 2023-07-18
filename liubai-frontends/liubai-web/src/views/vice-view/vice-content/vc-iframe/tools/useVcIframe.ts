import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import liuApi from "~/utils/liu-api"
import localCache from "~/utils/system/local-cache"
import type { VciProps } from "./types"
import thirdLink from "~/config/third-link"
import valTool from "~/utils/basic/val-tool"

type ThirdLinkKey = keyof typeof thirdLink

const add_white_bg: ThirdLinkKey[] = [
  "ZHIY_CC", 
  "PARAGRAPH_XYZ", 
  "GUOKR_COM",
  "BENTO_ME",
  "PRODUCTHUNT_CARD",
]

export function useVcIframe(props: VciProps) {
  const { route } = useRouteAndLiuRouter()
  const iframeEl = ref<HTMLIFrameElement | null>(null)
  const { bgColor, isCard, styles } = getStyles(props)

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
    isCard,
    styles,
  }
}


function getStyles(
  props: VciProps
) {

  const _getUrl = (val: string) => {
    let url: URL
    try {
      url = new URL(val)
    }
    catch{
      return
    } 
    return url
  }


  const bgColor = computed<string | undefined>(() => {
    const src = props.iframeSrc
    if(!src) return

    const WHITE_BG = `#fff`
    let url = _getUrl(src)
    if(!url) return

    const h = url.hostname

    // 给以下域名 在 iframe 里添加白色背景
    
    for(let i=0; i<add_white_bg.length; i++) {
      const key = add_white_bg[i]
      const v = thirdLink[key]
      const base = new URL(v)
      const isBase = valTool.isInDomain(h, base.hostname)
      if(isBase) return WHITE_BG
    }

    return undefined
  })


  const isCard = computed(() => {
    const otherData = props.otherData
    if(otherData?.isSpotify) return true
    if(otherData?.isAppleMusic) return true
    if(otherData?.isApplePodcast) return true
    return false
  })

  const styles = computed(() => {
    const h = props.vcHeight

    if(!isCard.value) {
      return {
        width: "100%",
        height: h,
        topVirtual: 0,
        bottomVirtual: 0,
      }
    }

    const w = `90%`
    if(h < 200) {
      return {
        width: w,
        height: h,
        topVirtual: 0,
        bottomVirtual: 0,
      }
    }

    const topVirtual = Math.round(h * 0.01)
    const bottomVirtual = Math.round(h * 0.02)
    const height = h - topVirtual - bottomVirtual
    return {
      width: w,
      height,
      topVirtual,
      bottomVirtual,
    }
  })
  

  return { bgColor, isCard, styles }
}