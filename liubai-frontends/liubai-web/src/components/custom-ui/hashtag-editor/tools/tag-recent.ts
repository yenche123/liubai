import type { HteData } from "./types"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { tagIdsToShows } from "~/utils/system/tag-related";

export function initRecent(
  hteData: HteData,
) {
  const wStore = useWorkspaceStore()
  const searchTagIds = wStore.myMember?.config?.searchTagIds ?? []
  hteData.recentTagIds = [...searchTagIds]
}

export function getRecent(
  hteData: HteData,
) {
  const { recentTagIds } = hteData
  if(recentTagIds.length < 1) return

  const data = tagIdsToShows(recentTagIds)
  const { newIds, tagShows } = data
  if(tagShows.length < 1) {
    hteData.recentTagIds = []
    hteData.list = []
    return
  }

  hteData.list = tagShows
  hteData.recentTagIds = newIds
}