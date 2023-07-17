import valTool from "~/utils/basic/val-tool";
import type { VcThirdParty } from "./types";
import thirdLink from "~/config/third-link";


export function isSpecialLink(
  link: string
): VcThirdParty | undefined {

  const url = new URL(link)
  const h = url.hostname
  const p = url.pathname


  // twitter
  const twitter = thirdLink.TWITTER_COM
  const twitter1 = new URL(twitter)
  const isTwitter = valTool.isInDomain(h, twitter1.hostname)
  if(isTwitter) {
    // 通常其尾部的 id 为 19 位的
    const twitterReg1 = /\/\w{1,32}\/status\/\d{16,32}/g
    const twitterMatch1 = p.match(twitterReg1)
    if(twitterMatch1) {
      return "TWITTER"
    }
  }

  return
}