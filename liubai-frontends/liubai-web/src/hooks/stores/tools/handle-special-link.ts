import valTool from "~/utils/basic/val-tool";
import type { ParticularScript } from "~/types/types-atom";
import thirdLink from "~/config/third-link";

// 判断给定的链接，是否需要注入第三方 script 才能在应用内打开的
export function isSpecialLink(
  link: string
): ParticularScript | undefined {

  const url = new URL(link)
  const h = url.hostname
  const p = url.pathname
  
  // twitter
  const twitter1 = new URL(thirdLink.TWITTER_COM)
  const isTwitter = valTool.isInDomain(h, twitter1.hostname)
  if(isTwitter) {
    // 通常其尾部的 id 为 19 位的
    const twitterReg1 = /\/\w{1,32}\/status\/\d{16,32}/g
    const twitterMatch1 = p.match(twitterReg1)
    if(twitterMatch1) return "twitter"
  }

  // instagram
  const ig1 = new URL(thirdLink.IG_P)
  const isInstagram = valTool.isInDomain(h, ig1.hostname)
  if(isInstagram) {
    const igReg1 = /\/p\/\w{6,20}/g
    const igMatch1 = p.match(igReg1)
    if(igMatch1) return "ig"
  }

  // calendly
  const calendly1 = new URL(thirdLink.CALENDLY_COM)
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
  const telegram1 = new URL(thirdLink.T_ME)
  const isTG = valTool.isInDomain(h, telegram1.hostname)
  if(isTG) {
    const tgReg1 = /^\/\w{2,32}\/\d{1,10}$/g
    const tgMatch1 = p.match(tgReg1)
    if(tgMatch1) return "telegram"
  }

  // github gist
  const ghGist1 = new URL(thirdLink.GITHUB_GIST)
  const isGitHubGist = valTool.isInDomain(h, ghGist1.hostname)
  if(isGitHubGist) {
    const ghGistReg1 = /^\/\w{3,20}\/\w{2,48}/g
    const ghGistMatch1 = p.match(ghGistReg1)
    if(ghGistMatch1) return "github_gist"
  }

  return
}