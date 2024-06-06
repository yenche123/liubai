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

function viewTransitionApi() {
  const res1 = isPrefersReducedMotion()
  if(res1) return false

  //@ts-expect-error: Transition API
  const hasViewTransition = Boolean(document.startViewTransition)

  return hasViewTransition
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

export default {
  isSafeBrowser,
  viewTransitionApi,
  cssDetectTextOverflow,
}