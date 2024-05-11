import { useSyncStore, type SyncStoreItem } from "~/hooks/stores/useSyncStore";
import type { CommentAreaData } from "./types"
import { storeToRefs } from "pinia";
import { watch } from "vue";
import liuEnv from "~/utils/liu-env";

export function useIdsChanged(
  caData: CommentAreaData,
) {
  const backend = liuEnv.hasBackend()
  if(!backend) return

  const syncStore = useSyncStore()
  const { comments } = storeToRefs(syncStore)
  watch(comments, (newV) => {
    if(newV.length < 1) return
    handleIdsChanged(caData, newV)
  })
}

function handleIdsChanged(
  caData: CommentAreaData,
  items: SyncStoreItem[],
) {
  const list = caData.comments
  if(list.length < 1) return

  console.log("comment-area handleIdsChanged.......")

  for(let i1=0; i1<items.length; i1++) {
    const v1 = items[i1]
    list.forEach((v2, i2) => {
      if(v1.first_id === v2.first_id && v1.new_id !== v2._id) {
        console.log("找到一个 first_id 相同 但是有 new_id 的对象了!")
        v2._id = v1.new_id
      }
    })
  }

}

