// 处理点击赞、收藏、评论分享等按钮

import { LiuRouter, useRouteAndLiuRouter } from "~/routes/liu-router"
import type { ThreadShow } from "~/types/types-content"
import type { TcProps, TcEmits } from "./types"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { getLocalPreference } from "~/utils/system/local-preference"
import type { ThreadOperation } from "../../tools/types"
import liuUtil from "~/utils/liu-util"
import tcCommon from "./tc-common"

interface TcoCtx {
  props: TcProps
  router: LiuRouter
  route: RouteLocationNormalizedLoaded
  tsStore: ThreadShowStore
  wStore: WorkspaceStore
  emits: TcEmits
}

export function useTcOperation(
  props: TcProps,
  emits: TcEmits,
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
    emits
  }

  const onTapComment = () => {
    console.log("onTapComment.........")
    handel_comment(ctx, props)
  }

  const onTapShare = () => {
    console.log("onTapShare.........")
  }

  const receiveBottomOperation = (operation: ThreadOperation) => {
    handleOperationFromBottomBar(ctx, operation)
  }

  return {
    onTapComment,
    onTapShare,
    receiveBottomOperation,
  }
}

function handleOperationFromBottomBar(
  ctx: TcoCtx,
  operation: ThreadOperation
) {
  const { position, threadData } = ctx.props
  const op = operation

  if(op === "edit") {
    // 编辑
    ctx.router.push({ name: "edit", params: { contentId: threadData._id } })
  }
  else if(op === "state" || op === "delete") {
    ctx.emits("newoperate", op, position, threadData)
  }
  else if(op === "restore" || op === "delete_forever") {
    ctx.emits("newoperate", op, position, threadData)
  }
  else if(op === "pin") {
    ctx.emits("newoperate", op, position, threadData)
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

// 跳转到详情页
function handel_comment(ctx: TcoCtx, props: TcProps) {
  if(props.displayType !== "list") {
    console.log("想办法聚焦 comment 的输入框......")
    return
  }
  const cid = props.threadData._id
  const res = liuUtil.toWhatDetail()
  if(res === "detail-page") {
    tcCommon.openDetailWithDetailPage(cid, ctx)
  }
  else if(res === "vice-view") {
    tcCommon.openDetailWithViceView(cid, ctx)
  }
}

function handleShare(ctx: TcoCtx) {

}

