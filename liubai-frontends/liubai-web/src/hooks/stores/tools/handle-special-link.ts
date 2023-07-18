import valTool from "~/utils/basic/val-tool";
import type { ParticularScript } from "~/types/types-third-party";
import thirdLink from "~/config/third-link";

// 判断给定的链接，是否需要注入第三方 script 才能在应用内打开的
export function isSpecialLink(
  link: string
): ParticularScript | undefined {

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
    if(twitterMatch1) return "twitter"
  }

  // calendly
  const calendly = thirdLink.CALENDLY_COM
  const calendly1 = new URL(calendly)
  const isCalendly = valTool.isInDomain(h, calendly1.hostname)
  if(isCalendly) {
    const calendlyReg1 = /^\/[\w\-]{2,32}\/[\w\-]{2,32}(?!=\/)/g
    const calendlyMatch1 = p.match(calendlyReg1)
    console.log("看一下 calendlyMatch1: ")
    console.log(calendlyMatch1)
    console.log(" ")
    if(calendlyMatch1) return "calendly"
  }

  // telegram
  const telegram = thirdLink.T_ME
  const telegram1 = new URL(telegram)
  const isTG = valTool.isInDomain(h, telegram1.hostname)
  if(isTG) {
    const tgReg1 = /^\/\w{2,32}\/\d{1,10}$/g
    const tgMatch1 = p.match(tgReg1)
    if(tgMatch1) return "telegram"
  }

  return
}