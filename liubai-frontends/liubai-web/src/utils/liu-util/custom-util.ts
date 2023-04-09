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

/** 防抖节流，判断点击是否过于频繁，若过于频繁返回 false，反之为 true */
interface CanTapOpt {
  duration: number
}

let lastTapBtn = 0
export function canTap(opt?: CanTapOpt) {
  if(!opt) {
    opt = {
      duration: 600
    }
  }

  const now = time.getTime()
  const diff = now - lastTapBtn
  if(diff < opt.duration) return false
  lastTapBtn = now
  return true
}


/** 校准侧边栏的宽度 
 *    原宽度包含隐藏拖动的范围若干 px，需要校准成视觉上看起来的宽度
*/
export function calibrateSidebarWidth(sidebarWidth: number) {
  let val = sidebarWidth - cfg.sidebar_spacing
  if(val < 0) val = 0
  return val
}
