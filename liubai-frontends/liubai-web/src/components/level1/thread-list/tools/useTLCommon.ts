import type { TlData, TlViewType } from "./types";
import type { Ref } from "vue"

export function handleLastItemStamp(
  viewType: TlViewType,
  tlData: TlData,
  lastItemStamp: Ref<number>,
) {
  const { list } = tlData
  const listLength = list.length
  const lastItem = list[listLength - 1]
  if(!lastItem) return
  const lastThread = lastItem.thread

  if(viewType === "FAVORITE") {
    lastItemStamp.value = lastThread.myFavoriteStamp ?? 0
  }
  else if(viewType === "TRASH") {
    lastItemStamp.value = lastThread.updatedStamp
  }
  else {
    lastItemStamp.value = lastThread.createdStamp
  }
}