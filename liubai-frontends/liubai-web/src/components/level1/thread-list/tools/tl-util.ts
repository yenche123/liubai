import type { ThreadShow } from "~/types/types-content"
import type { TlAtom } from "./types"


// 将 ThreadShow 转为 thread-list 的格式
function threadShowsToList(results: ThreadShow[]) {
  const newList: TlAtom[] = []
  results.forEach(v => {
    const obj: TlAtom = {
      thread: v,
      showType: "normal",
    }
    newList.push(obj)
  })
  return newList
}

function threadShowToItem(thread: ThreadShow): TlAtom {
  return {
    thread,
    showType: "normal",
  }
}

export default {
  threadShowsToList,
  threadShowToItem,
}