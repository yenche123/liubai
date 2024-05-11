import { useSyncStore, type SyncStoreItem } from "~/hooks/stores/useSyncStore";
import type { CeState } from "./atom-ce"
import { storeToRefs } from "pinia";
import { watch } from "vue";
import liuEnv from "~/utils/liu-env";

export function useDraftIdChanged(
  state: CeState,
) {
  const backend = liuEnv.hasBackend()
  if(!backend) return

  const syncStore = useSyncStore()
  const { drafts } = storeToRefs(syncStore)
  watch(drafts, (newV) => {
    if(newV.length < 1) return
    handleIdsChanged(state, newV)
  })
}


function handleIdsChanged(
  state: CeState,
  items: SyncStoreItem[],
) {
  const { draftId } = state
  if(!draftId) return

  for(let i1=0; i1<items.length; i1++) {
    const v1 = items[i1]
    if(v1.first_id === draftId) {
      state.draftId = v1.new_id
    }
  }
}