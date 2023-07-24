import type { TlData, TlViewType } from "./types";

export function handleLastItemStamp(
  viewType: TlViewType,
  tlData: TlData,
) {
  const { list } = tlData
  const listLength = list.length
  const lastItem = list[listLength - 1]
  if(!lastItem) return
  const lastThread = lastItem.thread

  if(viewType === "FAVORITE") {
    tlData.lastItemStamp = lastThread.myFavoriteStamp ?? 0
  }
  else if(viewType === "TRASH") {
    tlData.lastItemStamp = lastThread.updatedStamp
  }
  else {
    tlData.lastItemStamp = lastThread.createdStamp
  }
}