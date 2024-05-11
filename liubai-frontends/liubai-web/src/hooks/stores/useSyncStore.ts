// 当同步完成后
// 触发此 store 让其通知到各个组件
import { defineStore } from "pinia";
import { shallowRef } from "vue";

export interface SyncStoreAtom {
  whichType: "thread" | "comment" | "collection" | "draft"
  first_id: string
  new_id: string
}

export type SyncStoreItem = Omit<SyncStoreAtom, "whichType">

export const useSyncStore = defineStore("sync", () => {
  const threads = shallowRef<SyncStoreItem[]>([])
  const comments = shallowRef<SyncStoreItem[]>([])
  const drafts = shallowRef<SyncStoreItem[]>([])
  const collections = shallowRef<SyncStoreItem[]>([])

  const afterSync = (list: SyncStoreAtom[]) => {
    const tmpThreads: SyncStoreItem[] = []
    const tmpComments: SyncStoreItem[] = []
    const tmpDrafts: SyncStoreItem[] = []
    const tmpCollections: SyncStoreItem[] = []

    list.forEach(v => {
      const item: SyncStoreItem = {
        first_id: v.first_id,
        new_id: v.new_id,
      }
      const wt = v.whichType
      if(wt === "thread") tmpThreads.push(item)
      else if(wt === "comment") tmpComments.push(item)
      else if(wt === "draft") tmpDrafts.push(item)
      else if(wt === "collection") tmpCollections.push(item)
    })
    
    threads.value = tmpThreads
    comments.value = tmpComments
    drafts.value = tmpDrafts
    collections.value = tmpCollections
  }

  return {
    threads,
    comments,
    drafts,
    collections,
    afterSync,
  }
})