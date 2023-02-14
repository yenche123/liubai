// 一些自定义的 util
import type { WhatDetail } from "~/types/other/types-custom"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"
import type { RouteAndLiuRouter } from "~/routes/liu-router"

interface RrOpt {
  rr: RouteAndLiuRouter
  [otherKey: string]: any
}

export function openDetailWithViceView(cid: string, opt: RrOpt) {
  const { route, router } = opt.rr
  router.pushCurrentWithNewQuery(route, { cid })
}

export function openDetailWithDetailPage(contentId: string, opt: RrOpt) {
  const { route, router } = opt.rr
  router.pushNewPageWithOldQuery(route, { name: "detail", params: { contentId } })
}

export function toWhatDetail(): WhatDetail {
  const { width } = useWindowSize()
  if(width.value < cfg.vice_detail_breakpoint) return "detail-page"
  return "vice-view"
}

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