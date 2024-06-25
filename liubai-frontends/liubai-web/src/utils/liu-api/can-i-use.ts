import { isPrefersReducedMotion } from "./device"
import { getCharacteristic } from "./characteristic"
import valTool from "../basic/val-tool"
import liuEnv from "../liu-env"

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

  //@ts-expect-error: Transition API
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
 *    CSS property: animation-timeline: scroll()
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


export default {
  isSafeBrowser,
  viewTransitionApi,
  cssDetectTextOverflow,
  abortSignalTimeout,
  isArcBrowser,
  fedCM,
}