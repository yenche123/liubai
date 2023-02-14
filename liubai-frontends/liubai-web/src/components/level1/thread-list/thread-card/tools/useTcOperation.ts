// 处理点击赞、收藏、评论分享等按钮

import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import type { ThreadShow } from "~/types/types-content"
import type { TcProps, TcEmits } from "./types"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { ThreadOperation } from "~/types/types-atom"
import liuUtil from "~/utils/liu-util"
import valTool from "~/utils/basic/val-tool"
import type { PreCtx } from "~/components/level1/utils/tools/types"
import { preHandle } from "~/components/level1/utils/preHandle"
import commonOperate from "~/components/level1/utils/common-operate"

interface TcoCtx {
  props: TcProps
  rr: RouteAndLiuRouter
  tsStore: ThreadShowStore
  wStore: WorkspaceStore
  emits: TcEmits
}

export function useTcOperation(
  props: TcProps,
  emits: TcEmits,
) {

  const wStore = useWorkspaceStore()
  const rr = useRouteAndLiuRouter()
  const tsStore = useThreadShowStore()

  const ctx: TcoCtx = {
    props,
    rr,
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
    handle_edit(ctx, threadData)
  }
  else if(op === "hourglass") {
    handle_showCountdown(ctx, threadData)
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

function handle_edit(
  ctx: TcoCtx,
  threadData: ThreadShow,
) {
  ctx.rr.router.push({ name: "edit", params: { contentId: threadData._id } })
}

async function handle_showCountdown(
  ctx: TcoCtx,
  threadData: ThreadShow,
) {
  const thread = valTool.copyObject(threadData)
  const preCtx: PreCtx = {
    thread,
    rr: ctx.rr,
  }
  const d = await preHandle(preCtx)
  if(!d) return
  
  commonOperate.setShowCountdown(thread, d.memberId, d.userId)
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
    liuUtil.openDetailWithDetailPage(cid, ctx)
  }
  else if(res === "vice-view") {
    liuUtil.openDetailWithViceView(cid, ctx)
  }
}

function handleShare(ctx: TcoCtx) {

}

