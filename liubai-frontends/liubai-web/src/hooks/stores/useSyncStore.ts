// 当同步完成后
// 触发此 store 让其通知到各个组件
import { defineStore } from "pinia";
import { shallowRef } from "vue";

export interface SyncStoreAtom {
  whichType: "thread" | "comment" | "collection" | "draft"
  first_id: string
  new_id: string
}

type SyncStoreItem = Omit<SyncStoreAtom, "whichType">

export const useSyncStore = defineStore("sync", () => {
  const threads = shallowRef<SyncStoreItem[]>([])
  const comments = shallowRef<SyncStoreItem[]>([])

  const afterSync = (list: SyncStoreAtom[]) => {
    const tmpThreads: SyncStoreItem[] = []
    const tmpComments: SyncStoreItem[] = []

    list.forEach(v => {
      const item: SyncStoreItem = {
        first_id: v.first_id,
        new_id: v.new_id,
      }
      const wt = v.whichType
      if(wt === "thread") tmpThreads.push(item)
      else if(wt === "comment") tmpComments.push(item)
    })
    
    threads.value = tmpThreads
    comments.value = tmpComments
  }

  return {
    threads,
    comments,
    afterSync,
  }
})