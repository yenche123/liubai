import { reactive, watch } from "vue";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { tagIdsToShows } from "~/utils/system/tag-related";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import type { PageState } from "~/types/types-atom";
import type { TpView, TpData, TpCtx } from "./types"
import typeCheck from "~/utils/basic/type-check";
import liuUtil from "~/utils/liu-util";


export function useTagPage() {

  // 获取路由
  const { route } = useRouteAndLiuRouter()

  // 获取工作区
  const wStore = useWorkspaceStore()
  const { spaceId } = storeToRefs(wStore)

  // 获取状态变化
  const gStore = useGlobalStateStore()
  const { tagChangedNum } = storeToRefs(gStore)

  const tpData = reactive<TpData>({
    list: [],
  })

  const ctx: TpCtx = {
    route,
    spaceId,
    tpData,
    currentIdx: -1,
  }

  // 必须等 workspace 已初始化好，才能去加载 tag
  // 因为 tag 依赖于工作区
  watch([route, spaceId], (newV) => {
    whenContextChange(ctx)
  }, { immediate: true })

  // 监听标签发生变化
  watch(tagChangedNum, (newV, oldV) => {
    if(newV > oldV) {
      clearHiddenView(ctx)
      whenContextChange(ctx)
    }
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
    tpData,
    onTapFab,
    onScroll,
  }
}

function _getCurrentItem(ctx: TpCtx) {
  const idx = ctx.currentIdx
  if(idx < 0) return
  const item = ctx.tpData.list[idx]
  return item
}



function _getDefaultView(
  id: string, 
  tagName: string,
  state: PageState
): TpView {
  return {
    id,
    show: true,
    state,
    tagName,
    goToTop: 0,
    scrollPosition: 0,
  }
}


function whenContextChange(
  ctx: TpCtx,
) {

  const { route, spaceId } = ctx

  if(!route) return
  if(!spaceId.value) return

  const { name, params } = route
  if(name !== "tag" && name !== "collaborative-tag") return

  const id = params.tagId
  if(!typeCheck.isString(id)) return

  const { tagShows } = tagIdsToShows([id])
  if(!tagShows.length) {
    toLoadRemote(ctx, id)
    return
  }

  const tag = tagShows[0]
  const str = `${tag.emoji ? tag.emoji + ' ' : '# '}${tag.text}`
  const newView = _getDefaultView(id, str, -1)
  showView(ctx, newView)
}

async function toLoadRemote(
  ctx: TpCtx,
  tagId: string
) {
  // TODO: 去远端加载 tag
  // 目前先直接告诉组件查无动态
  const newView = _getDefaultView(tagId, "", 50)
  showView(ctx, newView)
}


function showView(
  ctx: TpCtx,
  newView: TpView,
) {
  const { list } = ctx.tpData

  let hasFound = false
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    if(v.id !== newView.id) {
      v.show = false
      continue
    }

    hasFound = true
    v.show = true
    v.state = newView.state
    v.tagName = newView.tagName
    ctx.currentIdx = i
  }

  if(!hasFound) {
    list.push(newView)
    if(list.length > 10) {
      list.splice(0, 1)
    }
    ctx.currentIdx = list.length - 1
  }
}

function clearHiddenView(
  ctx: TpCtx
) {
  console.log("清除隐藏的 tag-view")
  const { list } = ctx.tpData
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    if(!v.show) {
      list.splice(i, 1)
      i--
    }
  }
  ctx.currentIdx = list.length - 1
}