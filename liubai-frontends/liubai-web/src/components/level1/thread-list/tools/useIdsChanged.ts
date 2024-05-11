import { useSyncStore, type SyncStoreItem } from "~/hooks/stores/useSyncStore";
import type { TlData } from "./types";
import { storeToRefs } from "pinia";
import { watch } from "vue";

export function useIdsChanged(
  tlData: TlData,
) {

  const syncStore = useSyncStore()
  const { threads } = storeToRefs(syncStore)
  watch(threads, (newV) => {
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
        console.log("找到一个 first_id 相同 但是有 new_id 的对象了.......")
        tr._id = v1.new_id
      }
    })
  }

  console.log(`看一下 handleIdsChanged 后的 list: `)
  console.log(list)
  console.log(" ")
}