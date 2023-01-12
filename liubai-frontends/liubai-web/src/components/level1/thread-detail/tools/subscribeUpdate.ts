import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { TdData } from "./types"
import type { ThreadShow } from "~/types/types-content"

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

  const newThread = updatedList.find(v => {
    if(v._id === thread._id) return true
    
    // 如果 此时刚上传完动态至远端，那么会有一个短暂的字段 _old_id
    // 若其与 _id 相同，代表是相同的动态
    if(v._old_id && v._old_id === thread._id) return true

    return false
  })
  if(!newThread) return

  if(newThread.oState !== "OK") {
    tdData.state = 50
    return
  }

  tdData.state = -1
  tdData.threadShow = newThread
}