import type { ThreadOutterOperation } from "~/types/types-atom"
import type { ThreadShow } from '~/types/types-content'
import type { LiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { ThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import localCache from "~/utils/system/local-cache"
import type { TlData, TlEmits, TlProps } from "./types"
import valTool from "~/utils/basic/val-tool"
import threadOperate from "~/hooks/thread/thread-operate"
import liuUtil from "~/utils/liu-util"
import tlUtil from "./tl-util"
import { filterForCalendar } from "./handle-calendar"

interface ToCtx {
  router: LiuRouter
  route: RouteLocationNormalizedLoaded
  tsStore: ThreadShowStore
  position: number
  thread: ThreadShow
  memberId: string
  userId: string
  props: TlProps
  emit: TlEmits
  tlData: TlData
}

export function useThreadOperateInList(
  props: TlProps,
  emit: TlEmits,
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
    const { local_id: userId } = localCache.getPreference()

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
      emit,
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
  else if(operation === "float_up") {
    handle_float_up(ctx)
  }
}

// 去打开状态选择面板
async function handle_state(ctx: ToCtx) {
  const { memberId, userId, thread, tlData, position, props } = ctx
  const oldThread = liuUtil.copy.newData(thread)
  
  const { 
    tipPromise, 
    newStateId, 
    newStateShow 
  } = await threadOperate.selectState(oldThread, memberId, userId)
  if(!tipPromise) return

  // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const vT = props.viewType
  const listStateId = props.stateId
  const isHome = vT === "CALENDAR" || vT === "INDEX"

  if(vT === "STATE" && newStateId !== listStateId) {
    removedFromList = true
    await _toHide(tlData, position)
  }
  else if(isHome && newStateShow?.showInIndex === false) {
    removedFromList = true
    await _toHide(tlData, position)
  }

  // 2. 判断要不要撒花
  if(newStateShow?.showFireworks) {
    liuUtil.lightFireworks()
  }

  // 3. 判断是否为空了
  let runNoData = false
  if(removedFromList) {
    if(tlData.list.length < 1) {
      runNoData = true
      ctx.emit("nodata")
    }
  }

  // 4. 等待 snackbar 的返回
  const res4 = await tipPromise
  if(res4.result !== "tap") return

  // 5. 去执行公共的取消逻辑
  await threadOperate.undoState(oldThread, memberId, userId)

  // 6. 如果不曾移除，直接不再往下执行
  if(!removedFromList) return
  
  // 7. 若当前是 CALENDAR 列表，重新检查是否要再加回
  //   若能加回，则赋值 title_key
  let title_key: string | undefined
  if(vT === "CALENDAR") {
    const f7 = filterForCalendar([oldThread])
    if(f7.list.length < 1) return
    title_key = f7.title_key
  }
  
  // 8. 再次显示
  _toShowAgain(tlData, position, oldThread)

  // 9. 若曾经执行没有数据，触发又有数据了
  if(runNoData) {
    ctx.emit("hasdata", { title_key })
  }
}

// 去恢复
async function handle_restore(ctx: ToCtx) {
  const { memberId, userId, thread, props, tlData, position } = ctx
  const oldThread = liuUtil.copy.newData(thread)
  const vT = props.viewType

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

function _toShowAgain(
  tlData: TlData,
  poi: number,
  oldThread: ThreadShow,
) {
  tlData.list.splice(poi, 0, tlUtil.threadShowToItem(oldThread))
}


// 去删除（允许复原）
async function handle_delete(ctx: ToCtx) {
  const { 
    memberId, 
    userId, 
    thread, 
    tlData, 
    position,
    emit,
  } = ctx
  const oldThread = liuUtil.copy.newData(thread)
  const vT = ctx.props.viewType

  // 0. 执行消失动画、并删除 item
  await _toHide(tlData, position)

  // 1. 执行公共逻辑
  const { tipPromise } = await threadOperate.deleteThread(oldThread, memberId, userId)

  // 2. 判断是否要运行 emit("nodata")
  let runNoData = false
  if(tlData.list.length < 1) {
    runNoData = true
    emit("nodata")
  }

  // 3. 等待 snackbar 的返回
  const res3 = await tipPromise
  if(res3.result !== "tap") return

  // 发生撤销之后
  // 4. 去执行公共的取消逻辑
  await threadOperate.undoDelete(oldThread, memberId, userId)


  // 5. 若当前是 CALENDAR 列表，重新检查是否要再加回
  //   若能加回，则赋值 title_key
  let title_key: string | undefined
  if(vT === "CALENDAR") {
    const f5 = filterForCalendar([oldThread])
    if(f5.list.length < 1) return
    title_key = f5.title_key
  }

  // 6. 如果当前列表不是 PINNED, 把 item 加回 list 中
  // 因为 PINNED 列表在 useNewAndUpdate 里会自动将其加回
  if(vT !== "PINNED") {
    _toShowAgain(tlData, position, oldThread)
  }

  // 7. 判断是否运行过 emit('nodata')
  if(runNoData) {
    emit("hasdata", { title_key })
  }

}

// 去彻底删除
async function handle_deleteForever(ctx: ToCtx) {
  const { memberId, userId, thread, tlData, position } = ctx
  const oldThread = liuUtil.copy.newData(thread)
  const res = await threadOperate.deleteForever(oldThread, memberId, userId)
  if(!res) return

  // 1. 从列表里删除 item
  await _toHide(tlData, position)
}

// 去置顶（or 取消）
async function handle_pin(ctx: ToCtx) {
  const { memberId, userId, thread, tlData, position } = ctx
  const oldThread = liuUtil.copy.newData(thread)
  const { newPin, tipPromise } = await threadOperate.toPin(oldThread, memberId, userId)
  if(!tipPromise) return

  // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const vT = ctx.props.viewType
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
    _toShowAgain(tlData, position, oldThread)
  }
}

// 去收藏（or 取消）
async function handle_collect(ctx: ToCtx) {
  const { memberId, userId, thread, tlData, position } = ctx
  const oldThread = liuUtil.copy.newData(thread)
  const { newFavorite, tipPromise } = await threadOperate.toCollect(oldThread, memberId, userId)

  // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const vT = ctx.props.viewType
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
    _toShowAgain(tlData, position, oldThread)
  }
}

// 去冒泡
// 支持撤回，因为只是修改 wStore 里的
async function handle_float_up(ctx: ToCtx) {
  const { memberId, userId, thread, props, tlData, position } = ctx
  const theThread = liuUtil.copy.newData(thread)

  const { 
    tipPromise, 
  } = await threadOperate.floatUp(theThread, memberId, userId)
  if(!tipPromise) return

  // 1. 来判断当前列表里的该 item 是否要删除
  let removedFromList = false
  const vT = props.viewType
  if(vT === "STATE") {
    removedFromList = true
    await _toHide(tlData, position)
  }

  // 2. 等待 snackbar 返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 3. 去执行公共的取消逻辑
  await threadOperate.undoFloatUp(theThread, memberId, userId)
  
  // 4. 判断是否要重新加回
  if(removedFromList) {
    _toShowAgain(tlData, position, theThread)
  }
}



