import { 
  useSyncStore, 
  type SyncStoreItem, 
  type NewFileItem,
} from "~/hooks/stores/useSyncStore";
import type { CeData } from "./types"
import { storeToRefs } from "pinia";
import { watch } from "vue";
import liuEnv from "~/utils/liu-env";
import type { LiuFileStore, LiuImageStore } from "~/types";
import time from "~/utils/basic/time";

export function useDraftIdChanged(
  ceData: CeData,
) {
  const backend = liuEnv.hasBackend()
  if(!backend) return

  const syncStore = useSyncStore()
  const { drafts, files } = storeToRefs(syncStore)
  watch(drafts, (newV) => {
    if(newV.length < 1) return
    handleIdsChanged(ceData, newV)
  })

  watch(files, (newV) => {
    if(newV.length < 1) return
    handleCloudUrls(ceData, newV)
  })
}

function handleCloudUrls(
  ceData: CeData,
  items: NewFileItem[],
) {
  const { files = [], images = [] } = ceData

  // 1. using lastLockStamp to lock toSave
  ceData.lastLockStamp = time.getTime()

  // 2. to find
  const _find = (v1: LiuFileStore | LiuImageStore) => {
    const id = v1.id
    const d = items.find(v2 => v2.file_id === id)
    if(!d) return
    v1.cloud_url = d.cloud_url
  }

  files.forEach(_find)
  images.forEach(_find)
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