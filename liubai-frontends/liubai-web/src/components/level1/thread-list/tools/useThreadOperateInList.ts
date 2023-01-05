import type { ThreadOperation } from "./types"
import type { ThreadShow } from '../../../../types/types-content'
import type { LiuRouter } from "../../../../routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { ThreadShowStore } from "../../../../hooks/stores/useThreadShowStore"
import { useRouteAndLiuRouter } from "../../../../routes/liu-router"
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore"
import { useThreadShowStore } from "../../../../hooks/stores/useThreadShowStore"
import { getLocalPreference } from "../../../../utils/system/local-preference"
import type { TlProps, TlViewType } from "./types"
import type { Ref } from "vue";
import valTool from "../../../../utils/basic/val-tool"
import commonOperate from "../../utils/common-operate"

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

export function useThreadOperateInList(
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

// 跳转到详情页
function handel_comment(ctx: ToCtx) {

}


async function handle_collect(ctx: ToCtx) {
  const { memberId, userId, thread } = ctx
  const oldThread = valTool.copyObject(thread)
  const { newFavorite, tipPromise } = await commonOperate.toCollect(oldThread, memberId, userId)

  // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const viewType = ctx.props.viewType as TlViewType
  if(viewType === "FAVORITE" && !newFavorite) {
    removedFromList = true
    ctx.list.value.splice(ctx.position, 1)
  }

  // 2. 等待 snackbar 的返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 发生撤销之后
  // 3. 去执行公共的取消逻辑
  await commonOperate.undoCollect(oldThread, memberId, userId)

  // 4. 判断是否重新加回
  if(removedFromList) {
    ctx.list.value.splice(ctx.position, 0, oldThread)
  }
}



