// do not import too many files in this file as possible
// just because error occurring probably is just from those files
// which are inported
import { getStorageSafely, setStorageSafely } from "~/utils/basic/safe-funcs"
import liuConsole from "~/utils/debug/liu-console"
import { toUpdateSW } from "../pwa/useServiceWorker"

type ErrType = "Vite" | "IndexedDB"

const INDEXED_DB_ERR_1 = "attempt to get records from database without an in-progress transaction"

export function initListenError() {
  if(typeof window === "undefined") return
  if(!window.addEventListener) return

  const _report = (
    evt: Event,
    errType: ErrType,
  ) => {
    let category = "vite.preloadError"
    let message = "vite preload error"
    if(errType === "IndexedDB") {
      category = "indexeddb.error"
      message = "indexed db error"
    }

    liuConsole.addBreadcrumb({
      category,
      message,
      level: "error",
    })
    liuConsole.sendException(evt)
  }

  const _sendSkipWaitingMsg = () => {
    toUpdateSW()
  }

  const _getItemKey = (errType: ErrType) => {
    const key = errType === "Vite" ? "liu_vite-preload-err" : "liu_other-err"
    return key
  }

  const _reload = (errType: ErrType) => {
    const now = Date.now()
    const key = _getItemKey(errType)
    const isOK = setStorageSafely(key, now.toString())
    if(!isOK) return
    window.location.reload()
  }

  const _canReload = (errType: ErrType) => {
    const key = _getItemKey(errType)
    const lastReloadErr = getStorageSafely(key)
    if(!lastReloadErr) return true
    const now = Date.now()
    const stamp = Number(lastReloadErr)
    if(isNaN(stamp)) return false
    const duration = now - stamp
    if(duration < (60 * 1000)) return false
    return true
  }

  const _handleErr = (evt: Event, errType: ErrType) => {
    evt.preventDefault()

    setTimeout(() => {
      _report(evt, errType)
    }, 1)

    setTimeout(() => {
      if(!_canReload(errType)) return
      _sendSkipWaitingMsg()
    }, 2)

    setTimeout(() => {
      if(!_canReload(errType)) return
      _reload(errType)
    }, 1500)
  }

  let hasBeenReport = false
  window.addEventListener("vite:preloadError", (evt) => {
    console.warn("vite:preloadError evt: ")
    console.log(evt)
    console.log(" ")

    if(hasBeenReport) return
    hasBeenReport = true

    _handleErr(evt, "Vite")
  })

  window.addEventListener("error", (evt) => {
    console.warn("an error captured!")
    console.log(evt)

    const msg = evt.message
    console.log("message: ", msg)
    console.log(" ")

    if(!msg) return

    const msg2 = msg.toLowerCase()
    if(msg2.includes(INDEXED_DB_ERR_1)) {
      _handleErr(evt, "IndexedDB")
    }

  })

}