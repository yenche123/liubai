
import { ref, watch } from "vue"
import type { TagShow } from "../../../types/types-content"
import type { CeState } from "./atom-ce"
import type { Ref } from "vue"
import { addATag, tagIdsToShows } from "../../../utils/system/tag-related"
import type { HashTagEditorRes } from "../../../types/other/types-hashtag"
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore"
import time from "../../../utils/basic/time"

export function useCeTag(
  state: CeState
) {
  const gStore = useGlobalStateStore()
  const tagShows = ref<TagShow[]>([])
  
  watch(() => state.tagIds, (newV) => {
    whenTagIdsChange(state, newV, tagShows)
  }, { deep: true })

  const onTapClearTag = (index: number) => {
    const tagIds = state.tagIds
    if(index >= tagIds.length) return
    tagIds.splice(index, 1)
  }

  const onAddHashTag = async (data: HashTagEditorRes) => {
    let tagIds = state.tagIds
    let id = data.tagId
    if(id) {
      if(tagIds.includes(id)) return
      state.tagIds.push(id)
      return
    }
    const text = data.text as string
    const res = await addATag({ text, icon: data.icon })
    id = res.id
    if(!id) return
    state.tagIds.push(id)

    // 通知全局
    state.lastTagChangeStamp = time.getTime()
    gStore.addTagChangedNum()
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