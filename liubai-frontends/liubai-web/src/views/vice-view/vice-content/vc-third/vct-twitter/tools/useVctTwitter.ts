import valTool from "~/utils/basic/val-tool"
import type { VctTwitterProps } from "./types"
import { computed } from 'vue'
import thirdLink from "~/config/third-link"

export function useVctTwitter(props: VctTwitterProps) {
  
  // replace x.com with twitter.com
  const _link = computed(() => {
    const link = props.link
    if(!link) return link
    const url = new URL(link)
    const x_com = new URL(thirdLink.X_COM)
    const h = url.hostname
    const isX = valTool.isInDomain(h, x_com.hostname)
    if(!isX) return link
    const t_com = new URL(thirdLink.TWITTER_COM)
    url.hostname = t_com.hostname
    return url.toString()
  })

  return { _link }
}