import { useThreadShowStore } from "../../../../hooks/stores/useThreadShowStore"
import type { TdData } from "./types"
import type { ThreadShow } from "../../../../types/types-content"

export function subscribeUpdate(
  tdData: TdData
) {
  const tStore = useThreadShowStore()
  tStore.$subscribe((mutation, state) => {
    const { updatedThreadShows } = state
    if(updatedThreadShows.length > 0) {
      whenThreadsUpdated(tdData, updatedThreadShows)
    }
  })
}

function whenThreadsUpdated(
  tdData: TdData,
  updatedList: ThreadShow[]
) {

  const thread = tdData.threadShow
  if(!thread) return

  const newThread = updatedList.find(v => v._id === thread._id)
  if(!newThread) return

  if(newThread.oState !== "OK") {
    tdData.state = 50
    return
  }

  tdData.state = -1
  tdData.threadShow = newThread
}