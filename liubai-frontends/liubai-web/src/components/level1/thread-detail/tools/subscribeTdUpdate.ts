import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import { useGlobalStateStore, type KanbanStateChange } from "~/hooks/stores/useGlobalStateStore"
import { useCommentStore, type CommentStoreState } from "~/hooks/stores/useCommentStore"
import type { TdData } from "./types"
import type { ThreadShow } from "~/types/types-content"
import { storeToRefs } from "pinia"
import { watch } from "vue"
import type { WhyThreadChange } from "~/types/types-atom"

export function subscribeTdUpdate(
  tdData: TdData
) {

  // 监听 "动态" 发生变化
  const tStore = useThreadShowStore()
  tStore.$subscribe((mutation, state) => {
    const { updatedThreadShows, whyChange } = state
    if(updatedThreadShows.length > 0) {
      whenThreadsUpdated(tdData, updatedThreadShows, whyChange)
    }
  })

  // 监听 "看板状态" 变化
  const gStore = useGlobalStateStore()
  const { kanbanStateChange } = storeToRefs(gStore)
  watch(kanbanStateChange, (newV) => {
    if(!newV) return
    whenKanbanStateUpdated(tdData, newV)
  })

  // 监听评论区发生变化
  // 若情况符合，对 thread 的 commentNum 进行修改
  // 至于评论的修改，交由 comment-area 组件处理了
  const cStore = useCommentStore()
  cStore.$subscribe((mutation, state) => {
    whenCommentAddOrDelete(tdData, state)
  })
}

function whenCommentAddOrDelete(
  tdData: TdData,
  state: CommentStoreState,
) {
  const { 
    changeType, 
    commentId, 
    parentThread, 
    parentComment,
    replyToComment 
  } = state
  if(!changeType || !commentId) return
  const thread = tdData.threadShow
  if(!thread) return
  if(thread._id !== parentThread) return
  if(changeType === "edit" || changeType === "operate") return

  let num = thread.commentNum

  // 判断是否为 thread 两级内的评论
  if(!replyToComment || parentComment === replyToComment) {
    if(changeType === "add") num++
    else if(changeType === "delete") num--
    
    if(num < 0) num = 0
    thread.commentNum = num
  }
}


function whenKanbanStateUpdated(
  tdData: TdData,
  ksc: KanbanStateChange,
) {
  const thread = tdData.threadShow
  if(!thread) return
  let stateId = thread.stateId
  if(stateId !== ksc.stateId) return

  const { whyChange } = ksc
  if(whyChange === "delete") {
    thread.stateId = undefined
    thread.stateShow = undefined
  }
  else if(whyChange === "edit") {
    thread.stateShow = ksc.stateShow
  }
}


function whenThreadsUpdated(
  tdData: TdData,
  updatedList: ThreadShow[],
  whyChange: WhyThreadChange,
) {

  const thread = tdData.threadShow
  if(!thread) return

  // 1. 检查是否有无需监听变化的修改
  const NO_ACTIONS: WhyThreadChange[] = [
    "float_up", 
    "undo_float_up",
  ]
  const isInNoActions = NO_ACTIONS.includes(whyChange)
  if(isInNoActions) return

  // 2. 找出与当前 detail 里承载的 thread 一致的新动态
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