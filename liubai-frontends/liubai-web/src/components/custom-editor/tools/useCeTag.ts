
import { ref, watch } from "vue"
import { TagShow } from "../../../types/types-content"
import type { CeState } from "./atom-ce"
import type { Ref } from "vue"
import { tagIdsToShows } from "../../../utils/system/workspace"

export function useCeTag(
  state: CeState
) {

  const tagShows = ref<TagShow[]>([])
  
  watch(() => state.tagIds, (newV) => {
    whenTagIdsChange(state, newV, tagShows)
  }, { deep: true })

  const onTapClearTag = (index: number) => {
    const tagIds = state.tagIds
    if(index >= tagIds.length) return
    tagIds.splice(index, 1)
  }

  const onAddHashTag = () => {

  }


  return {
    tagShows,
    onTapClearTag,
    onAddHashTag,
  }
}


function whenTagIdsChange(
  state: CeState,
  newTagIds: string[] | undefined,
  tagShows: Ref<TagShow[]>,
) {
  console.log("whenTagIdsChange..........")

  if(!newTagIds || newTagIds.length < 1) {
    tagShows.value = []
    return
  }

  const { newIds, tagShows: _tagShows } = tagIdsToShows(newTagIds)

  // 存在 tagId 无法转成 tagShows 的情况
  if(newIds.length !== newTagIds.length) {
    state.tagIds = newIds
    return
  }

  tagShows.value = _tagShows
}