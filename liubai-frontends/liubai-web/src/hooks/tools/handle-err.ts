import { getStorageSafely, setStorageSafely } from "~/utils/basic/safe-funcs"

export type ErrType = "Vite" | "IndexedDB" | "DexieVersionChange"

function _getItemKey(errType: ErrType) {
  const key = errType === "Vite" ? "liu_vite-preload-err" : "liu_other-err"
  return key
}

export function toReload(errType: ErrType) {
  const now = Date.now()
  const key = _getItemKey(errType)
  const isOK = setStorageSafely(key, now.toString())
  if(!isOK) return
  window.location.reload()
}

export function canReload(errType: ErrType) {
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


