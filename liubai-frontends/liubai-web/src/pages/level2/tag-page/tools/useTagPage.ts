import { ref, watch } from "vue";
import type { Ref } from "vue";
import { useRouteAndLiuRouter } from "../../../../routes/liu-router";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import { tagIdsToShows } from "../../../../utils/system/workspace";
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";

export function useTagPage() {

  const tagName = ref("")
  const { route } = useRouteAndLiuRouter()
  const wStore = useWorkspaceStore()
  const { spaceId } = storeToRefs(wStore)

  // 必须等 workspace 已初始化好，才能去加载 tag
  // 因为 tag 依赖于工作区
  watch([route, spaceId], (newV) => {
    judgeTagName(tagName, route, spaceId)
  })

  judgeTagName(tagName, route, spaceId)
  
  return { tagName }
}


function judgeTagName(
  tagName: Ref<string>,
  route: RouteLocationNormalizedLoaded,
  spaceId: Ref<string>,
) {
  if(!route) return
  if(!spaceId.value) return
  const n = route.name
  if(!n) return
  if(n !== "tag" && n !== "collaborative-tag") return
  const { tagId } = route.params
  if(typeof tagId !== "string") return

  console.log("根据 tagId 查询 show...........")
  console.log(" ")
  const { tagShows } = tagIdsToShows([tagId])
  if(!tagShows.length) return
  const t = tagShows[0]
  const str = `${t.emoji ? t.emoji + ' ' : '# '}${t.text}`
  tagName.value = str
}