import { reactive, watch } from "vue";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import { 
  useGlobalStateStore, 
  type KanbanStateChange 
} from "~/hooks/stores/useGlobalStateStore";
import type { PageState } from "~/types/types-atom";
import type { SmpView, SmpData, SmpCtx } from "./types";
import typeCheck from "~/utils/basic/type-check";
import liuUtil from "~/utils/liu-util";
import commonPack from "~/utils/controllers/tools/common-pack";

export function useStateMorePage() {

  // 获取路由
  const { route } = useRouteAndLiuRouter()

  // 获取工作区
  const wStore = useWorkspaceStore()
  const { spaceId } = storeToRefs(wStore)

  // 获取状态变化
  const gStore = useGlobalStateStore()
  const { kanbanStateChange } = storeToRefs(gStore)

  const smpData = reactive<SmpData>({
    list: [],
  })

  const ctx: SmpCtx = {
    route,
    spaceId,
    smpData,
    currentIdx: -1,
  }

  // 必须等 workspace 已初始化好，才能去加载 stateId 下的动态
  // 因为 tag 依赖于工作区
  watch([route, spaceId], (newV) => {
    whenContextChange(ctx)
  }, { immediate: true })

  // 监听 状态 发生变化
  watch(kanbanStateChange, (newV, oldV) => {
    if(!newV) return
    whenStateChange(ctx, newV)
  })

  const onTapFab = () => {
    if(!liuUtil.canTap()) return
    const item = _getCurrentItem(ctx)
    if(!item) return
    item.goToTop++
  }

  const onScroll = (data: { scrollPosition: number }) => {
    const item = _getCurrentItem(ctx)
    if(!item) return
    item.scrollPosition = data.scrollPosition
  }
  
  return {
    smpData,
    onTapFab,
    onScroll,
  }
}

// 当 "看板状态" 发生变化（比如看板被编辑或删除）
function whenStateChange(
  ctx: SmpCtx,
  kanbanState: KanbanStateChange,
) {

  // 1. 清除所有被隐藏的 view
  clearHiddenView(ctx)

  // 2. 取出当前的 view
  const { currentIdx, smpData } = ctx
  const { list } = smpData
  const theView = list[currentIdx]
  if(!theView) return
  if(theView.id !== kanbanState.stateId) return

  const { whyChange, stateShow } = kanbanState

  // 当前的 stateId 被删除了
  if(whyChange === "delete") {
    theView.pState = 50
    return
  }

  // 当前的 stateId 被编辑了
  // 去获取其最新的名称
  if(whyChange === "edit" && stateShow) {
    theView.stateText = stateShow.text
    theView.stateTextKey = stateShow.text_key
    return
  }

}

// 当路由和工作区 id 发生变化
function whenContextChange(
  ctx: SmpCtx,
) {
  const { route, spaceId } = ctx
  if(!route) return
  if(!spaceId.value) return

  const { name, params } = route
  if(name !== "state-more" && name !== "collaborative-state-more") return

  const id = params.stateId
  if(!typeCheck.isString(id)) return

  const wStore = useWorkspaceStore()
  const data = commonPack.getStateShow(id, wStore)
  if(!data) {
    toLoadRemote(ctx, id)
    return
  }

  const newView = _getDefaultView(id, -1, data.text, data.text_key)
  showView(ctx, newView)
}

async function toLoadRemote(
  ctx: SmpCtx,
  stateId: string
) {
  // TODO: 去远端加载 stateId
  // 目前先直接告诉组件查无动态
  const newView = _getDefaultView(stateId, 50)
  showView(ctx, newView)
}

function showView(
  ctx: SmpCtx,
  newData: SmpView,
) {
  const { list } = ctx.smpData

  let hasFound = false
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    if(v.id !== newData.id) {
      v.show = false
      continue
    }

    hasFound = true
    v.show = true
    v.stateText = newData.stateText
    v.stateTextKey = newData.stateTextKey
    ctx.currentIdx = i
  }

  if(!hasFound) {
    list.push(newData)
    if(list.length > 10) {
      list.splice(0, 1)
    }
    ctx.currentIdx = list.length - 1
  }
}

function _getDefaultView(
  id: string, 
  pState: PageState,
  stateText?: string,
  stateTextKey?: string,
): SmpView {
  return {
    id,
    show: true,
    pState,
    stateText,
    stateTextKey,
    goToTop: 0,
    scrollPosition: 0,
  }
}

function _getCurrentItem(ctx: SmpCtx) {
  const idx = ctx.currentIdx
  if(idx < 0) return
  const item = ctx.smpData.list[idx]
  return item
}

function clearHiddenView(
  ctx: SmpCtx,
) {
  const { list } = ctx.smpData
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    if(!v.show) {
      list.splice(i, 1)
      i--
    }
  }
  ctx.currentIdx = list.length - 1
}

