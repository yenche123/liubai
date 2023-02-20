// 一些自定义的 util
import time from "../basic/time"
import type { 
  RouteLocationNormalizedLoaded,
  LocationQuery,
} from "vue-router"
import cfg from "~/config"

/******* 转换颜色 *******/

// 将 --liu 转为 #.....
export function colorToShow(val: string) {
  let idx1 = val.indexOf("var(")
  if(idx1 === 0) return val
  let idx2 = val.indexOf("--liu")
  if(idx2 === 0) {
    return `var(${val})`
  }
  return val
}

// 将 `var(CSS变量)` 变量转为 CSS 变量
export function colorToStorage(val: string) {
  let idx1 = val.indexOf("var(")
  if(idx1 === 0) {
    return val.substring(4, val.length - 1)
  }
  return val
}

/***** 一些防抖节流相关的函数 */
let lastKeyUpDown = 0
export function canKeyUpDown() {
  const now = time.getTime()
  const diff = now - lastKeyUpDown
  if(diff < 28) return false
  lastKeyUpDown = now
  return true
}

/*** 根据当前的 route.query 获取基本要保留的参数，比如 tags **/
export function getDefaultRouteQuery(
  route: RouteLocationNormalizedLoaded
) {
  const newQuery: Record<string, string> = {}
  const q = route.query

  const { tags } = q

  if(tags && typeof tags === "string") {
    newQuery.tags = tags
  }

  return newQuery
}

/** 是否该打开侧边栏 vice-view */
export function needToOpenViceView(query: LocationQuery) {
  if(!query) return false
  let { cid } = query
  if(cid) return true
  const { iframe_keys } = cfg
  for(let key of iframe_keys) {
    if(query[key]) {
      return true
    }
  }
  return false
}