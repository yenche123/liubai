import { RouteLocationNormalized } from "vue-router"


// 要 path / query 都一一匹配 才视为相同 route
export const isSameRoute = (r1: string, r2: RouteLocationNormalized): boolean => {

  if((!r1 && !r2.fullPath) || (!r1 && r2.fullPath === "/")) return true
  const url = new URL(r1, location.origin)

  const idx = r2.fullPath.indexOf(url.pathname)
  if(idx !== 0) {
    return false
  }

  if(r2.path !== url.pathname) {
    return false
  }

  const queryKeys = Object.keys(r2.query)
  for(let i=0; i<queryKeys.length; i++) {
    const key = queryKeys[i]
    const q1 = url.searchParams.get(key)
    const q2 = r2.query[key]
    if(q1 !== q2) return false
  }

  return true
}