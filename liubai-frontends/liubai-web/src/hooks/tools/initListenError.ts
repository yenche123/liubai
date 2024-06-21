// do not import too many files in this file as possible
// just because error occurring probably is just from those files
// which are inported

import liuConsole from "~/utils/debug/liu-console"

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

  const _reload = () => {
    window.location.reload()
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
      _reload()
    }, 500)
  })

}