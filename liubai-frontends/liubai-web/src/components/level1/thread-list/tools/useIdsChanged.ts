import { useSyncStore, type SyncStoreItem } from "~/hooks/stores/useSyncStore";
import type { TlData } from "./types";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import liuEnv from "~/utils/liu-env";

export function useIdsChanged(
  tlData: TlData,
) {
  const backend = liuEnv.hasBackend()
  if(!backend) return

  const syncStore = useSyncStore()
  const { threads } = storeToRefs(syncStore)
  watch(threads, (newV) => {
    if(newV.length < 1) return
    handleIdsChanged(tlData, newV)
  })
}

function handleIdsChanged(
  tlData: TlData,
  items: SyncStoreItem[],
) {
  const list = tlData.list
  if(list.length < 1) return

  for(let i1=0; i1<items.length; i1++) {
    const v1 = items[i1]
    list.forEach((v2, i2) => {
      const tr = v2.thread
      if(v1.first_id === tr.first_id && v1.new_id !== tr._id) {
        console.log("thread-list some _id changed!")
        console.log(v1.first_id)
        console.log(v1.new_id)
        console.log(" ")
        tr._id = v1.new_id
      }
    })
  }

}