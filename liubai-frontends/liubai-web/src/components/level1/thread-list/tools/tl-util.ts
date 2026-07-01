import type { ThreadShow } from "~/types/types-content"
import type { TlAtom, TlData, TlViewType } from "./types"

// 将 ThreadShow 转为 thread-list 的格式
function threadShowsToList(
  results: ThreadShow[],
) {
  const newList: TlAtom[] = []
  results.forEach(v => {
    const obj = threadShowToItem(v)
    newList.push(obj)
  })
  return newList
}

function threadShowToItem(
  thread: ThreadShow,
): TlAtom {
  const obj: TlAtom = {
    thread,
    showType: "normal",
  }
  return obj
}

function handleLastItemStamp(
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
  else if(vT === "PAST" || vT === "CALENDAR_RANGE") {
    tlData.lastItemStamp = lastThread.calendarStamp ?? 0
  }
  else if(vT === "STATE") {
    tlData.lastItemStamp = lastThread.stateStamp ?? 0
  }
  else {
    tlData.lastItemStamp = lastThread.createdStamp
  }
}

export default {
  threadShowsToList,
  threadShowToItem,
  handleLastItemStamp,
}