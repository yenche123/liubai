import type { HsirAtom, HsirData, HsirProps } from "./types";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { tagIdsToShows, addTagIdsToRecents } from "~/utils/system/tag-related";

export function initRecent(
  hsirData: HsirData,
) {
  const wStore = useWorkspaceStore()
  const searchTagIds = wStore.myMember?.config?.searchTagIds ?? []
  hsirData.recentTagIds = [...searchTagIds]
}

export function getRecent(
  props: HsirProps,
  hsirData: HsirData,
) {
  const { recentTagIds } = hsirData
  if(recentTagIds.length < 1) return

  const data = tagIdsToShows(recentTagIds)
  const { newIds, tagShows } = data
  if(tagShows.length < 1) {
    hsirData.recentTagIds = []
    hsirData.list = []
    return
  }

  const { listAdded } = props
  const newList = tagShows.map(v => {
    const theData = listAdded.find(v2 => {
      if(v2.tagId && v2.tagId === v.tagId) {
        return true
      }
      if(v2.text === v.text) return true
      return false
    })
    let added = Boolean(theData)
    const obj: HsirAtom = { ...v, added }
    return obj
  })
  hsirData.list = newList
  hsirData.recentTagIds = newIds
}

export async function addRecent(
  hsirData: HsirData,
  tagId: string,
) {
  const newSearchTagIds = await addTagIdsToRecents([tagId])
  if(newSearchTagIds) {
    hsirData.recentTagIds = newSearchTagIds
  }
}