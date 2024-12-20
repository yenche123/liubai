// 一些自定义的 util
import time from "../basic/time"
import type { 
  RouteLocationNormalizedLoaded,
  LocationQuery,
} from "vue-router"
import cfg from "~/config"
import confetti from "canvas-confetti";
import { useWindowSize } from "~/hooks/useVueUse"
import { useVvLinkStore } from "~/hooks/stores/useVvLinkStore";
import { useVvFileStore } from "~/hooks/stores/useVvFileStore";
import valTool from "../basic/val-tool";
import { POPUP_KEYS } from "~/config/atom"

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
/** 在连续压着上（下）键时，能防抖截流一下  */
let lastKeyUpDown = 0
export function canKeyUpDown() {
  if(time.isWithinMillis(lastKeyUpDown, 50)) return false
  lastKeyUpDown = time.getTime()
  return true
}

/*** 根据当前的 route.query 获取基本要保留的参数，比如 tags **/
export function getDefaultRouteQuery(
  route: RouteLocationNormalizedLoaded
) {
  const newQuery: Record<string, string> = {}
  const q = route.query

  const { tags } = q

  if(valTool.isStringWithVal(tags)) {
    newQuery.tags = tags
  }

  return newQuery
}

/** 是否该打开侧边栏 vice-view */
export function needToOpenViceView(query: LocationQuery) {
  if(!query) return false
  let { cid, vlink, cid2, vfile } = query
  if(cid || cid2) return true

  if(valTool.isStringWithVal(vlink)) {
    const vvLinkStore = useVvLinkStore()
    const url = vvLinkStore.getUrlById(vlink)
    return Boolean(url)
  }

  if(valTool.isStringWithVal(vfile)) {
    const vvFileStore = useVvFileStore()
    const url = vvFileStore.getUrlById(vfile)
    return Boolean(url)
  }

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
  
  if(time.isWithinMillis(lastTapBtn, opt.duration)) return false
  lastTapBtn = time.getTime()
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

/** 获取当前 main-view 里 center 区域完整显示（也就是不会被 vice-view 遮住）时的最小临界值 
 * @param clientWidth 当前窗口宽度
 * @param centerRight 中间加右侧的宽度，也就是窗口宽度减去左侧侧边栏宽度
*/
export function getMainViewCriticalValue(
  clientWidth: number,
  centerRight: number,
) {
  const default_min = cfg.min_mainview_width
  let min = default_min

  // 当屏幕宽度比较大时，也就是大约 pad 以上的宽度
  if(clientWidth > 900) {
    min = Math.round(clientWidth / 3)
  }
  if(min > default_min * 2) {
    min = default_min * 2
  }
  const criticalValue = Math.max(min, centerRight / 4)
  return criticalValue
}


/**
 * 发射烟花
 */
export function lightFireworks() {
  const { width } = useWindowSize()
  const w = width.value

  // 碎片的数量 介于 60 ~ 180 之间
  let particleCount = Math.round((0.08 * w) + 36)
  if(particleCount < 60) particleCount = 60
  else if(particleCount > 180) particleCount = 180

  // 左侧烟花的角度
  let angle = Math.round((-0.01666 * w) + 75)
  if(angle > 70) angle = 70
  else if(angle < 45) angle = 45

  // 初速
  let startVelocity = Math.round((0.05 * w) + 30)
  if(startVelocity > 150) startVelocity = 150
  else if(startVelocity < 45) startVelocity = 45


  // 左侧的烟花
  confetti({
    particleCount,
    angle,
    spread: 27,
    startVelocity,
    origin: {
      x: 0.1,
      y: 0.9,
    },
    scalar: 1.1,
    zIndex: 6000,
  })

  // 右侧的烟花
  confetti({
    particleCount,
    angle: (180 - angle),
    spread: 27,
    startVelocity,
    origin: {
      x: 0.9,
      y: 0.9,
    },
    scalar: 1.1,
    zIndex: 6000,
  })
}

/**
 * 根据当前 route 判断是否在某个 popup 内
 */
export function isInAPopUp(
  route: RouteLocationNormalizedLoaded,
  filterKeys: string[] = [],
) {

  const q = route.query
  if(!q) return false

  const strQ = valTool.objToStr(q)
  if(!strQ || strQ === "{}") return false

  const keys = [...POPUP_KEYS]
  for(let i=0; i<filterKeys.length; i++) {
    const v = filterKeys[i]
    const idx = keys.indexOf(v)
    if(idx >= 0) keys.splice(idx, 1)
  }

  for(let i=0; i<keys.length; i++) {
    const key = keys[i]
    const val = q[key]
    if(typeof val === 'string') return true
  }

  return false
}

/**
 * 等待一个帧数周期
 */
export async function waitAFrame(more: boolean = false) {
  const duration = more ? cfg.frame_duration_2 : cfg.frame_duration
  await valTool.waitMilli(duration)
}
