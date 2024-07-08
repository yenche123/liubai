// do not import too many files in this file as possible
// just because error occurring probably is just from those files
// which are inported

import liuConsole from "~/utils/debug/liu-console"
import { toUpdateSW } from "../pwa/useServiceWorker"

export function initListenError() {
  if(typeof window === "undefined") return
  if(!window.addEventListener) return

  const _report = (evt: Event) => {
    liuConsole.addBreadcrumb({
      category: "vite.preloadError",
      message: "vite preload error",
      level: "error",
    })
    liuConsole.sendException(evt)
  }

  const _sendSkipWaitingMsg = () => {
    toUpdateSW()
  }

  const _reload = () => {
    const now = Date.now()
    localStorage.setItem("liu_vite-preload-err", now.toString())
    window.location.reload()
  }

  const _canReload = () => {
    const lastReloadErr = localStorage.getItem("liu_vite-preload-err")
    if(!lastReloadErr) return true
    const now = Date.now()
    const stamp = Number(lastReloadErr)
    if(isNaN(stamp)) return false
    const duration = now - stamp
    if(duration < (60 * 1000)) return false
    return true
  }

  let hasBeenReport = false
  window.addEventListener("vite:preloadError", (evt) => {
    console.warn("vite:preloadError evt: ")
    console.log(evt)
    console.log(" ")

    if(hasBeenReport) return
    hasBeenReport = true

    evt.preventDefault()

    setTimeout(() => {
      _report(evt)
    }, 1)

    setTimeout(() => {
      _sendSkipWaitingMsg()
    }, 2)

    setTimeout(() => {
      if(!_canReload()) return
      _reload()
    }, 1500)
  })

}