import type { TlData, TlViewType } from "./types";

export function handleLastItemStamp(
  vT: TlViewType,
  tlData: TlData,
) {
  const { list } = tlData
  const listLength = list.length
  const lastItem = list[listLength - 1]
  if(!lastItem) {
    if(tlData.lastItemStamp) tlData.lastItemStamp = 0
    return
  }
  const lastThread = lastItem.thread

  if(vT === "FAVORITE") {
    tlData.lastItemStamp = lastThread.myFavoriteStamp ?? 0
  }
  else if(vT === "TRASH") {
    tlData.lastItemStamp = lastThread.removedStamp ?? 0
  }
  else {
    tlData.lastItemStamp = lastThread.createdStamp
  }
}