
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import type { WhatDetail } from "~/types/other/types-custom"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"
import thirdLink from "~/config/third-link"
import { useLayoutStore } from "~/views/useLayoutStore"
import { useVvLinkStore } from "~/hooks/stores/useVvLinkStore"

interface RrOpt {
  rr: RouteAndLiuRouter
  replace?: boolean
  [otherKey: string]: any
}

export type InnerOrOutter = "inner" | "outter"

function toWhatDetail(): WhatDetail {
  const { width } = useWindowSize()

  let point = cfg.vice_detail_breakpoint
  const { sidebarWidth } = useLayoutStore()
  if(sidebarWidth <= 0) point -= 150
  
  if(width.value < point) return "detail-page"
  return "vice-view"
}

function openDetail(contentId: string, opt: RrOpt) {
  const w = toWhatDetail()
  if(w === "detail-page") openDetailWithDetailPage(contentId, opt)
  else if(w === "vice-view") openDetailWithViceView(contentId, opt)
}

function openDetailWithViceView(cid: string, opt: RrOpt) {
  const { route, router } = opt.rr
  if(opt.replace) router.replaceWithNewQuery(route, { cid })
  else router.pushCurrentWithNewQuery(route, { cid })
}

function openDetailWithDetailPage(contentId: string, opt: RrOpt) {
  const { route, router } = opt.rr
  let newPage = { name: "detail", params: { contentId } }
  if(opt.replace) router.replace(newPage)
  else router.pushNewPageWithOldQuery(route, newPage)
}

function openComment(cid2: string, opt: RrOpt) {
  const w = toWhatDetail()
  if(w === "detail-page") openCommentWithDetailPage(cid2, opt)
  else if(w === "vice-view") openCommentWithViceView(cid2, opt)
}

function openCommentWithViceView(cid2: string, opt: RrOpt) {
  const { route, router } = opt.rr
  if(opt.replace) router.replaceWithNewQuery(route, { cid2 })
  else router.pushCurrentWithNewQuery(route, { cid2 })
}

function openCommentWithDetailPage(cid2: string, opt: RrOpt) {
  const { route, router } = opt.rr
  let newPage = { name: "comment", params: { commentId: cid2 } }
  if(opt.replace) router.replace(newPage)
  else router.pushNewPageWithOldQuery(route, newPage)
}


// 打开外部搜索
function openOutSearch(
  keyword: string, 
  opt: RrOpt,
  forceVv: boolean = false
) {
  const { route, router } = opt.rr
  const newQ = { outq: keyword }
  if(opt.replace) router.replaceWithNewQuery(route, newQ)
  else router.pushCurrentWithNewQuery(route, newQ)
}

/************* Bing ************/
function openBing(
  keyword: string, 
  opt: RrOpt, 
  forceVv: boolean = false
): InnerOrOutter {
  const { route, router } = opt.rr
  const w = toWhatDetail()
  if(forceVv || w === "vice-view") {
    const newQ = { bing: keyword }
    if(opt.replace) router.replaceWithNewQuery(route, newQ)
    else router.pushCurrentWithNewQuery(route, newQ)
    return "inner"
  }
  openExternalBing(keyword)
  return "outter"
}

function getBingSearchLink(keyword: string) {
  const url = new URL(thirdLink.BING_SEARCH)
  url.searchParams.append("showconv", "1")
  url.searchParams.append("sendquery", "1")
  url.searchParams.append("q", keyword)
  return url.toString()
}

function openExternalBing(keyword: string) {
  const url = getBingSearchLink(keyword)
  window.open(url.toString(), "_blank")
}


/************* 小红书 ************/
function openXhs(
  keyword: string, 
  opt: RrOpt,
  forceVv: boolean = false,
): InnerOrOutter {
  const { route, router } = opt.rr
  const w = toWhatDetail()
  if(forceVv || w === "vice-view") {
    const newQ = { xhs: keyword }
    if(opt.replace) router.replaceWithNewQuery(route, newQ)
    else router.pushCurrentWithNewQuery(route, newQ)
    return "inner"
  }
  openExternalXhs(keyword)
  return "outter"
}

function getXhsSearchLink(keyword: string) {
  const url = new URL(thirdLink.XHS_SEARCH)
  url.searchParams.append("name", keyword)
  return url.toString()
}

function openExternalXhs(keyword: string) {
  const url = getXhsSearchLink(keyword)
  window.open(url, "_blank")
}


/************* Github ************/
function openGithub(
  keyword: string, 
  opt: RrOpt,
  forceVv: boolean = false,
): InnerOrOutter {
  openExternalGithub(keyword)
  return "outter"
}

function getGithubSearchLink(keyword: string) {
  const url = new URL(thirdLink.GITHUB_SEARCH)
  url.searchParams.append("q", keyword)
  return url.toString()
}

function openExternalGithub(keyword: string) {
  const url = getGithubSearchLink(keyword)
  window.open(url, "_blank")
}

/******** 打开外部链接 *****/
function openLink(
  url: string, 
  opt: RrOpt,
  forceVv: boolean = false,
) {
  const w = toWhatDetail()
  if(!forceVv && w !== "vice-view") {
    window.open(url, "_blank")
    return "outter"
  }

  const { route, router } = opt.rr
  const vStore = useVvLinkStore()
  const nowLink = vStore.getCurrentLink(route)
  if(nowLink === url) return "inner"

  const res = vStore.canAdd(url)
  if(!res) {
    window.open(url, "_blank")
    return "outter"
  }

  const vlink = vStore.addLink(url)
  const newQ = { vlink }
  if(opt.replace) router.replaceWithNewQuery(route, newQ)
  else router.pushCurrentWithNewQuery(route, newQ)
  return "inner"
}


export default {
  toWhatDetail,
  openDetail,
  openDetailWithViceView,
  openDetailWithDetailPage,
  openComment,
  openCommentWithViceView,
  openCommentWithDetailPage,
  openOutSearch,
  openBing,
  getBingSearchLink,
  openExternalBing,
  openXhs,
  getXhsSearchLink,
  openExternalXhs,
  openGithub,
  getGithubSearchLink,
  openExternalGithub,
  openLink,
}