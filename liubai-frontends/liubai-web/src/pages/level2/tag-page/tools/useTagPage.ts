import { ref, watch } from "vue";
import type { Ref } from "vue";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import { tagIdsToShows } from "~/utils/system/tag-related";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";

interface TpCtx {
  route: RouteLocationNormalizedLoaded
  tagName: Ref<string>
  tagId: Ref<string>
  spaceId: Ref<string>
}

export function useTagPage() {
  const tagId = ref("")
  const tagName = ref("")
  const { route } = useRouteAndLiuRouter()
  const wStore = useWorkspaceStore()
  const { spaceId } = storeToRefs(wStore)
  const gStore = useGlobalStateStore()
  const { tagChangedNum } = storeToRefs(gStore)

  const ctx = {
    route,
    tagId,
    spaceId,
    tagName
  }

  // 必须等 workspace 已初始化好，才能去加载 tag
  // 因为 tag 依赖于工作区
  watch([route, spaceId, tagChangedNum], (newV) => {
    judgeTagName(ctx)
  })

  judgeTagName(ctx)
  
  return { tagName, tagId }
}


function judgeTagName(
  ctx: TpCtx,
) {
  if(!ctx.route) return
  if(!ctx.spaceId.value) return
  const n = ctx.route.name
  if(!n) return
  if(n !== "tag" && n !== "collaborative-tag") return
  const { tagId } = ctx.route.params
  if(typeof tagId !== "string") return

  const { tagShows } = tagIdsToShows([tagId])
  if(!tagShows.length) return
  const t = tagShows[0]
  const str = `${t.emoji ? t.emoji + ' ' : '# '}${t.text}`
  ctx.tagId.value = tagId
  ctx.tagName.value = str
}