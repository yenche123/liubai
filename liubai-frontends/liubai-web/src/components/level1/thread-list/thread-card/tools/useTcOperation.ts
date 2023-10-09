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
import valTool from "~/utils/basic/val-tool"
import type { PreCtx } from "~/components/level1/utils/tools/types"
import { preHandle } from "~/components/level1/utils/preHandle"
import threadOperate from "~/hooks/thread/thread-operate";
import cui from "~/components/custom-ui"
import { createTagsFromTagShows } from "~/utils/system/tag-related"

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
    handel_comment(ctx)
  }

  const onTapShare = () => {
    handle_share(ctx)
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
  else if(op === "tag") {
    handle_tag(ctx, threadData)
  }
  else if(op === "state" || op === "delete") {
    ctx.emits("newoperate", op, position, threadData)
  }
  else if(op === "restore" || op === "delete_forever") {
    ctx.emits("newoperate", op, position, threadData)
  }
  else if(op === "pin" || op === "float_up") {
    ctx.emits("newoperate", op, position, threadData)
  }
}


async function handle_tag(
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
  
  const tags = valTool.copyObject(threadData.tags ?? [])
  const res = await cui.showHashtagSelector({ tags })
  if(!res.confirm || !res.tags) return

  const res2 = await createTagsFromTagShows(res.tags)
  if(!res2.isOk) return

  const newTagShows = res2.tagShows
  
  // 去 threadOperate 修改动态.....
  threadOperate.setTags(thread, newTagShows, d.memberId, d.userId)
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
  
  threadOperate.setShowCountdown(thread, d.memberId, d.userId)
}

function handel_comment(ctx: TcoCtx) {
  const { isInCommentDetail, displayType } = ctx.props

  // 当前动态不在列表里 并且 不在 comment-detail 里
  if(displayType !== "list" && !isInCommentDetail) {
    ctx.emits("requestfocus")
    return
  }

  cui.showCommentPopup({
    operation: "reply_thread",
    threadShow: ctx.props.threadData,
  })
}

function handle_share(ctx: TcoCtx) {
  const thread = ctx.props.threadData
  const { visScope, _id: threadId, config: cfg } = thread
  const allowComment = cfg?.allowComment ?? false
  
  cui.showShareView({ threadId, visScope, allowComment, thread })
}

