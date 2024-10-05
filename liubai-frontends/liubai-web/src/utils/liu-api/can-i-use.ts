import { isPrefersReducedMotion } from "./device"
import { getCharacteristic } from "./characteristic"
import valTool from "../basic/val-tool"
import liuEnv from "../liu-env"
import type { LiuYorN } from "~/types/types-basic"

function isSafeBrowser() {
  if(!window) return false
  const _sub = window.crypto?.subtle
  const hasBackend = liuEnv.hasBackend()
  if(typeof _sub === "undefined" && hasBackend) return false
  return true
}

// check if it is in Arc browser
// reference: https://webmasters.stackexchange.com/a/142231/138612
function isArcBrowser() {
  // the function cannot put into getCharacteristic()
  // because CSS from Arc may not be loaded yet
  
  const arcPaletteTitle = window.getComputedStyle(document.documentElement)
    .getPropertyValue("--arc-palette-title")
  return Boolean(arcPaletteTitle)
}

function viewTransitionApi() {
  const res1 = isPrefersReducedMotion()
  if(res1) return false

  const hasViewTransition = Boolean(document.startViewTransition)

  return hasViewTransition
}

function abortSignalTimeout() {
  if(typeof AbortSignal === "undefined") return false
  if(typeof AbortSignal.timeout === "undefined") return false
  return true
}

/** Using CSS to detect text overflow
 *  https://juejin.cn/post/7347221074704777226
 *  tech stacks:
 *    CSS at-rule: @container: Style queries
 *      see: https://developer.mozilla.org/en-US/docs/Web/CSS/@container#browser_compatibility
 *    CSS property: animation-timeline: scroll()
 *      see: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline#browser_compatibility
 */
function cssDetectTextOverflow() {
  const cha = getCharacteristic()
  if(!cha.isChrome || !cha.browserVersion) return false
  const res = valTool.compareVersion(cha.browserVersion, "115.0.0")
  return res >= 0
}

// see: https://developers.google.com/identity/gsi/web/guides/fedcm-migration#before_you_begin
// & https://developer.mozilla.org/en-US/docs/Web/API/FedCM_API#browser_compatibility
function fedCM() {
  const cha = getCharacteristic()
  const { isChrome, browserVersion } = cha

  if(isChrome && browserVersion) {
    const res1 = valTool.compareVersion(browserVersion, "117.0.0")
    return res1 >= 0
  }

  return false
}

function isRunningStandalone() {
  //@ts-expect-error Property only exists on Safari
  const standalone = window.navigator.standalone
  if(typeof standalone === "boolean") {
    return standalone
  }

  try {
    const res = window.matchMedia('(display-mode: standalone)').matches
    return res
  }
  catch(err) {
    console.warn("fail to call window.matchMedia('(display-mode: standalone)').matches")
    console.log(err)
  }

  return false
}


async function hasInstalledPWA(): Promise<LiuYorN> {
  const res1 = isRunningStandalone()
  if(res1) return "Y"

  const { isSafari } = getCharacteristic()
  if(isSafari) {
    if(res1) return "Y"
    return "N"
  }

  const res2 = "getInstalledRelatedApps" in navigator
  if(!res2) {
    console.warn("navigator.getInstalledRelatedApps is not supported")
    return "U"
  }
  
  // console.log("to call getInstalledRelatedApps............")

  const d1 = Date.now()
  //@ts-expect-error getInstalledRelatedApps is undefined
  const relatedApps = await navigator.getInstalledRelatedApps()
  const d2 = Date.now()

  // sometimes it consumes too much, like 32s
  // console.log(`getInstalledRelatedApps 耗时: ${d2 - d1} ms`)
  // console.log(relatedApps)
  // console.table(relatedApps)

  if(relatedApps.length > 0) return "Y"
  return "N"
}

function canAddToHomeScreenInSafari() {
  const { isSafari, isInWebView, browserVersion } = getCharacteristic()
  if(isInWebView) return
  if(!isSafari) return
  if(!browserVersion) return

  const res = valTool.compareVersion(browserVersion, "17.0")
  return res >= 0
}


export default {
  isSafeBrowser,
  viewTransitionApi,
  cssDetectTextOverflow,
  abortSignalTimeout,
  isArcBrowser,
  fedCM,
  isRunningStandalone,
  hasInstalledPWA,
  canAddToHomeScreenInSafari,
}