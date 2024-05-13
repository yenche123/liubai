import { useSyncStore, type SyncStoreItem } from "~/hooks/stores/useSyncStore";
import type { CeData } from "./types"
import { storeToRefs } from "pinia";
import { watch } from "vue";
import liuEnv from "~/utils/liu-env";

export function useDraftIdChanged(
  ceData: CeData,
) {
  const backend = liuEnv.hasBackend()
  if(!backend) return

  const syncStore = useSyncStore()
  const { drafts } = storeToRefs(syncStore)
  watch(drafts, (newV) => {
    if(newV.length < 1) return
    handleIdsChanged(ceData, newV)
  })
}


function handleIdsChanged(
  ceData: CeData,
  items: SyncStoreItem[],
) {
  const { draftId } = ceData
  if(!draftId) return

  for(let i1=0; i1<items.length; i1++) {
    const v1 = items[i1]
    if(v1.first_id === draftId) {
      ceData.draftId = v1.new_id
    }
  }
}