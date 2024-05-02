import { isPrefersReducedMotion } from "./device"
import { getCharacteristic } from "./characteristic"
import valTool from "../basic/val-tool"

function viewTransitionApi() {
  const res1 = isPrefersReducedMotion()
  if(res1) return false

  //@ts-expect-error: Transition API
  const hasViewTransition = Boolean(document.startViewTransition)

  return hasViewTransition
}

// reference: https://juejin.cn/post/7347221074704777226
function cssDetectTextOverflow() {
  const cha = getCharacteristic()
  if(!cha.isChrome || !cha.chromeVersion) return false
  const res = valTool.compareVersion(cha.chromeVersion, "115.0.0")
  return res >= 0
}

export default {
  viewTransitionApi,
  cssDetectTextOverflow,
}