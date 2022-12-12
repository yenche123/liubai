// 处理点击赞、收藏、评论分享等按钮

import { LiuRouter, useRouteAndLiuRouter } from "../../../../../routes/liu-router"
import type { ThreadShow } from "../../../../../types/types-content"
import time from "../../../../../utils/basic/time"
import type { TcProps } from "./types"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { useThreadShowStore } from "../../../../../hooks/stores/useThreadShowStore"
import type { ThreadShowStore } from "../../../../../hooks/stores/useThreadShowStore"
import { useWorkspaceStore } from "../../../../../hooks/stores/useWorkspaceStore"
import type { WorkspaceStore } from "../../../../../hooks/stores/useWorkspaceStore"
import { db } from "../../../../../utils/db"
import { getLocalPreference } from "../../../../../utils/system/local-preference"

interface TcoCtx {
  props: TcProps
  router: LiuRouter
  route: RouteLocationNormalizedLoaded
  tsStore: ThreadShowStore
  wStore: WorkspaceStore
}

export function useTcOperation(
  props: TcProps,
) {

  const wStore = useWorkspaceStore()
  const { route, router } = useRouteAndLiuRouter()
  const tsStore = useThreadShowStore()

  const ctx: TcoCtx = {
    props,
    router,
    route,
    tsStore,
    wStore,
  }

  const onTapCollect = () => {
    handleCollect(ctx)
  }

  const onTapComment = () => {

  }

  const onTapShare = () => {

  }


  return {
    onTapCollect,
    onTapComment,
    onTapShare,
  }
}

function _getNewThreadShow(props: TcProps) {
  const oldThread = props.threadData
  const newThread = JSON.parse(JSON.stringify(oldThread)) as ThreadShow
  return newThread
}

function _getMyData(ctx: TcoCtx) {
  const { memberId } = ctx.wStore
  const { local_id: userId = "" } = getLocalPreference()

  return { memberId, userId }
}

async function handleCollect(ctx: TcoCtx) {
  //0. 取出我的个人数据
  const { userId, memberId } = _getMyData(ctx)
  if(!memberId) {
    console.warn("没有 memberId")
    return
  }

  //1. 生成新的 threadShow 然后通知全局，以快速响应视图
  const newThread = _getNewThreadShow(ctx.props)
  newThread.myFavorite = !Boolean(newThread.myFavorite)
  newThread.myFavoriteStamp = time.getTime()

  console.log("去更新 threadShows.......")
  ctx.tsStore.setUpdatedThreadShows([newThread])

  // 2. 修改本地数据
  

}

function handleComment(ctx: TcoCtx) {

}

function handleShare(ctx: TcoCtx) {

}

