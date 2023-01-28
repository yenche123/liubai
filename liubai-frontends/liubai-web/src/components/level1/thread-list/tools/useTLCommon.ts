import type { ThreadShow } from "~/types/types-content";
import type { TlViewType } from "./types";
import type { Ref } from "vue"

export function handleLastItemStamp(
  viewType: TlViewType,
  list: ThreadShow[],
  lastItemStamp: Ref<number>,
) {
  const listLength = list.length
  const lastItem = list[listLength - 1]
  if(!lastItem) return
  if(viewType === "FAVORITE") {
    lastItemStamp.value = lastItem.myFavoriteStamp ?? 0
  }
  else if(viewType === "TRASH") {
    lastItemStamp.value = lastItem.updatedStamp
  }
  else {
    lastItemStamp.value = lastItem.createdStamp
  }
}