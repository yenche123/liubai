import { isPrefersReducedMotion } from "./device"


function viewTransitionApi() {
  const res1 = isPrefersReducedMotion()
  if(res1) return false

  //@ts-expect-error: Transition API
  const hasViewTransition = Boolean(document.startViewTransition)

  return hasViewTransition
}

export default {
  viewTransitionApi,
}