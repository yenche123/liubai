import type { ThreadOutterOperation } from "~/types/types-atom"
import type { ThreadShow } from '~/types/types-content'
import type { LiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { ThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import { getLocalPreference } from "~/utils/system/local-preference"
import type { TlProps, TlViewType } from "./types"
import type { Ref } from "vue";
import valTool from "~/utils/basic/val-tool"
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
    operation: ThreadOutterOperation, 
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

    handleOutterOperation(ctx, operation)
  }

  return { receiveOperation }
}


function handleOutterOperation(
  ctx: ToCtx,
  operation: ThreadOutterOperation
) {

  console.log("handleOutterOperation..........")
  console.log(operation)
  console.log(" ")

  if(operation === "collect") {
    handle_collect(ctx)
  }
  else if(operation === "emoji") {

  }
  else if(operation === "delete") {
    handle_delete(ctx)
  }
  else if(operation === "restore") {
    handle_restore(ctx)
  }
  else if(operation === "delete_forever") {
    handle_deleteForever(ctx)
  }
  else if(operation === "pin") {
    handle_pin(ctx)
  }
}

// 去恢复
async function handle_restore(ctx: ToCtx) {
  const { memberId, userId, thread } = ctx
  const oldThread = valTool.copyObject(thread)

  // 1. 先从 list 里删除是为了避免 menu 的抖动
  ctx.list.value.splice(ctx.position, 1)

  // 2. 执行 restore 公共逻辑
  const res = await commonOperate.restoreThread(oldThread, memberId, userId)
}

// 去删除（允许复原）
async function handle_delete(ctx: ToCtx) {
  const { memberId, userId, thread } = ctx
  const oldThread = valTool.copyObject(thread)
  const vT = ctx.props.viewType as TlViewType

  // 0. 从列表里删除 item，先删除的原因是避免 menu 的抖动
  ctx.list.value.splice(ctx.position, 1)

  // 1. 执行公共逻辑
  const { tipPromise } = await commonOperate.deleteThread(oldThread, memberId, userId)

  // 2. 等待 snackbar 的返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 发生撤销之后
  // 3. 去执行公共的取消逻辑
  await commonOperate.undoDelete(oldThread, memberId, userId)

  // 4. 如果当前列表不是 PINNED, 把 item 加回 list 中
  // 因为 PINNED 列表在 useNewAndUpdate 里会自动将其加回
  if(vT !== "PINNED") {
    ctx.list.value.splice(ctx.position, 0, oldThread)
  }
}

// 去彻底删除
async function handle_deleteForever(ctx: ToCtx) {
  const { memberId, userId, thread } = ctx
  const oldThread = valTool.copyObject(thread)
  const res = await commonOperate.deleteForever(oldThread, memberId, userId)
  if(!res) return

  // 1. 从列表里删除 item
  ctx.list.value.splice(ctx.position, 1)
}

// 去置顶（or 取消）
async function handle_pin(ctx: ToCtx) {
  const { memberId, userId, thread } = ctx
  const oldThread = valTool.copyObject(thread)
  const { newPin, tipPromise } = await commonOperate.toPin(oldThread, memberId, userId)
  if(!tipPromise) return

  // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const vT = ctx.props.viewType as TlViewType
  if(vT === "INDEX" && newPin) {
    removedFromList = true
    ctx.list.value.splice(ctx.position, 1)
  }

  // 2. 等待 snackbar 的返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 3. 去执行公共的取消逻辑
  await commonOperate.undoPin(oldThread, memberId, userId)

  // 4. 判断是否重新加回
  if(removedFromList) {
    ctx.list.value.splice(ctx.position, 0, oldThread)
  }
}

// 去收藏（or 取消）
async function handle_collect(ctx: ToCtx) {
  const { memberId, userId, thread } = ctx
  const oldThread = valTool.copyObject(thread)
  const { newFavorite, tipPromise } = await commonOperate.toCollect(oldThread, memberId, userId)

  // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const vT = ctx.props.viewType as TlViewType
  if(vT === "FAVORITE" && !newFavorite) {
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



