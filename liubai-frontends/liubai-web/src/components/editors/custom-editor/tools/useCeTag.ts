
import { ref, watch, type Ref } from "vue"
import type { TagShow } from "~/types/types-content"
import type { CeData } from "./types"
import { 
  addATag, 
  tagIdsToShows, 
  addTagIdsToRecents,
  createTagsFromTagShows,
} from "~/utils/system/tag-related"
import type { HashTagEditorRes } from "~/types/other/types-hashtag"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import time from "~/utils/basic/time"

export function useCeTag(
  ceData: CeData
) {
  let lockWatch = false    // 是否要冻结 watch
                           // 若为 true，当 watch(() => ceData.tagIds
                           // 被触发时，直接 skip

  const gStore = useGlobalStateStore()
  const tagShows = ref<TagShow[]>([])
  
  watch(() => ceData.tagIds, (newV) => {
    if(lockWatch) {
      lockWatch = false
      return
    }
    whenTagIdsChange(ceData, newV, tagShows)
  }, { deep: true })

  const onTapClearTag = (index: number) => {
    const tagIds = ceData.tagIds
    if(index >= tagIds.length) return
    tagIds.splice(index, 1)
  }

  const onAddHashTag = async (data: HashTagEditorRes) => {
    let tagIds = ceData.tagIds
    let id = data.tagId
    if(id) {
      addTagIdsToRecents([id])
      if(tagIds.includes(id)) return
      ceData.tagIds.push(id)
      return
    }

    const text = data.text as string
    const res = await addATag({ text, icon: data.icon })
    id = res.id
    if(!id) return
    ceData.tagIds.push(id)

    // 通知全局
    ceData.lastTagChangeStamp = time.getTime()
    gStore.addTagChangedNum("create")
  }

  const onNewHashTags = async (tags: TagShow[]) => {
    if(tags.length < 1) {
      ceData.tagIds = []
      return
    }

    ceData.lastTagChangeStamp = time.getTime()

    const res = await createTagsFromTagShows(tags)
    if(!res.isOk) return
    const newTagShows = res.tagShows
    lockWatch = true
    tagShows.value = newTagShows
    ceData.tagIds = newTagShows.map(v => v.tagId)
  }

  return {
    tagShows,
    onTapClearTag,
    onAddHashTag,
    onNewHashTags,
  }
}


function whenTagIdsChange(
  ceData: CeData,
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
    ceData.tagIds = newIds
    return
  }

  tagShows.value = _tagShows
}