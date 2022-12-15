import type { ThreadOperation } from "./types"
import type { ThreadShow } from '../../../../types/types-content'
import type { LiuRouter } from "../../../../routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { ThreadShowStore } from "../../../../hooks/stores/useThreadShowStore"
import { useRouteAndLiuRouter } from "../../../../routes/liu-router"
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore"
import { useThreadShowStore } from "../../../../hooks/stores/useThreadShowStore"
import { getLocalPreference } from "../../../../utils/system/local-preference"
import time from "../../../../utils/basic/time"
import dbOp from "./db-op"
import cui from "../../../custom-ui"
import type { TlProps, TlViewType } from "./types"
import type { Ref } from "vue";

interface ToCtx {
  router: LiuRouter
  route: RouteLocationNormalizedLoaded
  tsStore: ThreadShowStore
  position: number
  thread: ThreadShow
  memberId: string
  userId: string
  props: TlProps
  list: Ref<ThreadShow[]>
}

export function useThreadOperate(
  props: TlProps,
  list: Ref<ThreadShow[]>
) {
  const wStore = useWorkspaceStore()
  const { route, router } = useRouteAndLiuRouter()
  const tsStore = useThreadShowStore()


  const receiveOperation = (
    operation: ThreadOperation, 
    position: number, 
    thread: ThreadShow
  ) => {
    const { memberId } = wStore
    const { local_id: userId } = getLocalPreference()

    // 因为是列表页，是登录的情况下才能查看得到，故 memberId / userId 不存在，直接走异常逻辑
    if(!memberId || !userId) {
      return
    }

    const ctx: ToCtx = {
      router,
      route,
      tsStore,
      position,
      thread,
      memberId,
      userId,
      props,
      list
    }

    if(operation === "collect") {
      handle_collect(ctx)
    }
    else if(operation === "comment") {

    }
    else if(operation === "emoji") {

    }
    else if(operation === "share") {

    }
  }

  return { receiveOperation }
}

function _copyThread(t1: ThreadShow) {
  const t2 = JSON.parse(JSON.stringify(t1)) as ThreadShow
  return t2
}

async function handle_collect(ctx: ToCtx) {
  const oldThread = _copyThread(ctx.thread)
  const newThread = _copyThread(ctx.thread)

  // 1. 修改状态
  newThread.myFavorite = !Boolean(oldThread.myFavorite)
  newThread.myFavoriteStamp = time.getTime()

  // 2. 通知全局
  ctx.tsStore.setUpdatedThreadShows([newThread])

  // 3. 操作 db
  const res = await dbOp.collect(newThread, ctx.memberId, ctx.userId)

  // 4. 判断当前列表里的 该 item 是否要删除
  let removedFromList = false
  const viewType = ctx.props.viewType as TlViewType
  if(viewType === "FAVORITE" && !newThread.myFavorite) {
    removedFromList = true
    ctx.list.value.splice(ctx.position, 1)
  }

  // 5. 显示操作成功的 snackbar 并且带撤回按钮
  let text_key = newThread.myFavorite ? "tip.collected" : "tip.canceled"
  const res2 = await cui.showSnackBar({ text_key, action_key: "tip.undo" })

  if(res2.result !== "tap") {
    // 用户没有撤销，去同步远端
    return
  }

  // 6.1 复原
  ctx.tsStore.setUpdatedThreadShows([oldThread])
  // 6.2 操作 db
  const res3 = await dbOp.collect(oldThread, ctx.memberId, ctx.userId)
  // 6.3 判断是否重新加回
  if(removedFromList) {
    ctx.list.value.splice(ctx.position, 0, oldThread)
  }

}



