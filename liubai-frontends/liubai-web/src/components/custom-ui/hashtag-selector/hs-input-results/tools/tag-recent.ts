import type { HsirData } from "./types";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { tagIdsToShows } from "~/utils/system/tag-related";


export function initRecent(
  hsirData: HsirData
) {
  const wStore = useWorkspaceStore()
  const searchTagIds = wStore.myMember?.config?.searchTagIds ?? []
  hsirData.recentTagIds = [...searchTagIds]
  getRecent(hsirData)
}

export function getRecent(
  hsirData: HsirData
) {
  const { recentTagIds } = hsirData
  if(recentTagIds.length < 1) return

  const data = tagIdsToShows(recentTagIds)

}

export function addRecent(
  tagId: string,
) {



}