import type { ThreadOutterOperation } from "~/types/types-atom"
import type { ThreadShow } from '~/types/types-content'
import type { LiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { ThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import localCache from "~/utils/system/local-cache"
import type { TlData, TlProps, TlViewType } from "./types"
import type { Ref } from "vue";
import valTool from "~/utils/basic/val-tool"
import threadOperate from "~/hooks/thread/thread-operate";
import liuUtil from "~/utils/liu-util"
import tlUtil from "./tl-util"

interface ToCtx {
  router: LiuRouter
  route: RouteLocationNormalizedLoaded
  tsStore: ThreadShowStore
  position: number
  thread: ThreadShow
  memberId: string
  userId: string
  props: TlProps
  tlData: TlData
}

export function useThreadOperateInList(
  props: TlProps,
  tlData: TlData,
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
    const { local_id: userId } = localCache.getLocalPreference()

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
      tlData,
    }

    handleOutterOperation(ctx, operation)
  }

  return { receiveOperation }
}


function handleOutterOperation(
  ctx: ToCtx,
  operation: ThreadOutterOperation
) {

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
  else if(operation === "state") {
    handle_state(ctx)
  }
}

// 去打开状态选择面板
async function handle_state(ctx: ToCtx) {
  const { memberId, userId, thread, tlData, position } = ctx
  const oldThread = valTool.copyObject(thread)
  
  const { 
    tipPromise, 
    newStateId, 
    newStateShow 
  } = await threadOperate.selectState(oldThread, memberId, userId)
  if(!tipPromise) return

    // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const vT = ctx.props.viewType as TlViewType
  const listStateId = ctx.props.stateId
  if(vT === "STATE" && newStateId !== listStateId) {
    removedFromList = true
    await _toHide(tlData, position)
  }
  else if(vT === "INDEX" && newStateShow?.showInIndex === false) {
    removedFromList = true
    await _toHide(tlData, position)
  }

  // 2. 判断要不要撒花
  if(newStateShow?.showFireworks) {
    liuUtil.lightFireworks()
  }

  // 3. 等待 snackbar 的返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 4. 去执行公共的取消逻辑
  await threadOperate.undoState(oldThread, memberId, userId)

  // 5. 判断是否重新加回
  if(removedFromList) {
    tlData.list.splice(position, 0, tlUtil.threadShowToItem(oldThread))
  }
}

// 去恢复
async function handle_restore(ctx: ToCtx) {
  const { memberId, userId, thread, props, tlData, position } = ctx
  const oldThread = valTool.copyObject(thread)
  const vT = props.viewType as TlViewType

  // 1. 如果当前是在回收桶里，先从 list 里删除是为了避免 menu 的抖动
  if(vT === "TRASH") {
    await _toHide(tlData, position)
  }

  // 2. 执行 restore 公共逻辑
  const res = await threadOperate.restoreThread(oldThread, memberId, userId)
}

// 执行隐藏动画、并删除
async function _toHide(
  tlData: TlData,
  poi: number,
) {
  tlData.list[poi].showType = 'hiding'
  await valTool.waitMilli(301)
  tlData.list.splice(poi, 1)
}

// 去删除（允许复原）
async function handle_delete(ctx: ToCtx) {
  const { memberId, userId, thread, tlData, position } = ctx
  const oldThread = valTool.copyObject(thread)
  const vT = ctx.props.viewType as TlViewType

  // 0. 执行消失动画、并删除 item
  await _toHide(tlData, position)

  // 1. 执行公共逻辑
  const { tipPromise } = await threadOperate.deleteThread(oldThread, memberId, userId)

  // 2. 等待 snackbar 的返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 发生撤销之后
  // 3. 去执行公共的取消逻辑
  await threadOperate.undoDelete(oldThread, memberId, userId)

  // 4. 如果当前列表不是 PINNED, 把 item 加回 list 中
  // 因为 PINNED 列表在 useNewAndUpdate 里会自动将其加回
  if(vT !== "PINNED") {
    tlData.list.splice(position, 0, tlUtil.threadShowToItem(oldThread))
  }
}

// 去彻底删除
async function handle_deleteForever(ctx: ToCtx) {
  const { memberId, userId, thread, tlData, position } = ctx
  const oldThread = valTool.copyObject(thread)
  const res = await threadOperate.deleteForever(oldThread, memberId, userId)
  if(!res) return

  // 1. 从列表里删除 item
  await _toHide(tlData, position)
}

// 去置顶（or 取消）
async function handle_pin(ctx: ToCtx) {
  const { memberId, userId, thread, tlData, position } = ctx
  const oldThread = valTool.copyObject(thread)
  const { newPin, tipPromise } = await threadOperate.toPin(oldThread, memberId, userId)
  if(!tipPromise) return

  // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const vT = ctx.props.viewType as TlViewType
  if(vT === "INDEX" && newPin) {
    removedFromList = true
    // 由于界面的上方会被添加进 pin 列表里
    // 又删除又新增的，就别执行消失动画了
    tlData.list.splice(position, 1)
  }

  // 2. 等待 snackbar 的返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 3. 去执行公共的取消逻辑
  await threadOperate.undoPin(oldThread, memberId, userId)

  // 4. 判断是否重新加回
  if(removedFromList) {
    tlData.list.splice(position, 0, tlUtil.threadShowToItem(oldThread))
  }
}

// 去收藏（or 取消）
async function handle_collect(ctx: ToCtx) {
  const { memberId, userId, thread, tlData, position } = ctx
  const oldThread = valTool.copyObject(thread)
  const { newFavorite, tipPromise } = await threadOperate.toCollect(oldThread, memberId, userId)

  // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const vT = ctx.props.viewType as TlViewType
  if(vT === "FAVORITE" && !newFavorite) {
    removedFromList = true
    await _toHide(tlData, position)
  }

  // 2. 等待 snackbar 的返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 发生撤销之后
  // 3. 去执行公共的取消逻辑
  await threadOperate.undoCollect(oldThread, memberId, userId)

  // 4. 判断是否重新加回
  if(removedFromList) {
    tlData.list.splice(position, 0, tlUtil.threadShowToItem(oldThread))
  }
}



