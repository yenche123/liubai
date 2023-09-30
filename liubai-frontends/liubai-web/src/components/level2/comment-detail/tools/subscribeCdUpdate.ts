// 当评论被新增或更新时
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import { 
  useGlobalStateStore, 
  type KanbanStateChange
} from "~/hooks/stores/useGlobalStateStore"
import { 
  useCommentStore, 
  type CommentStoreState 
} from "~/hooks/stores/useCommentStore"
import type { CommentDetailData } from "./types";
import type { CommentShow, ThreadShow } from "~/types/types-content"
import { storeToRefs } from "pinia"
import { watch } from "vue"
import valTool from "~/utils/basic/val-tool";

export function subscribeCdUpdate(
  cdData: CommentDetailData
) {


  // 监听 "动态" 变化
  const tStore = useThreadShowStore()
  tStore.$subscribe((mutation, state) => {
    const { updatedThreadShows } = state
    if(updatedThreadShows.length > 0) {
      whenThreadsUpdated(cdData, updatedThreadShows)
    }
  })
  

  // 监听 "看板状态" 变化
  const gStore = useGlobalStateStore()
  const { kanbanStateChange } = storeToRefs(gStore)
  watch(kanbanStateChange, (newV) => {
    if(!newV) return
    whenKanbanStateUpdated(cdData, newV)
  })


  // 监听 "评论" 发生变化
  // 若情况符合，对 thread 的 commentNum 进行修改
  const cStore = useCommentStore()
  cStore.$subscribe((mutation, state) => {
    whenCommentUpdate(cdData, state)
  })

}

function whenThreadsUpdated(
  cdData: CommentDetailData,
  updatedList: ThreadShow[]
) {
  const { thread } = cdData
  if(!thread) return

  const newThread = updatedList.find(v => {
    if(v._id === thread._id) return true
    
    // 如果 此时刚上传完动态至远端，那么会有一个短暂的字段 _old_id
    // 若其与 _id 相同，代表是相同的动态
    if(v._old_id && v._old_id === thread._id) return true
    return false
  })

  if(!newThread) return
  cdData.thread = newThread
}

function whenCommentUpdate(
  cdData: CommentDetailData,
  state: CommentStoreState,
) {
  const { 
    targetId,
    targetComment,
    aboveList,
    belowList,
    thread,
  } = cdData

  if(!targetComment) return

  const changedId = state.commentId
  const changeType = state.changeType
  const newComment = valTool.copyObject(state.commentShow)
  const { replyToComment, parentComment } = state

  // I. 如果目标评论就是被改变的评论
  if(targetId === changedId) {
    if(changeType === "delete") {
      cdData.state = 50
      // 二级评论: replyToComment 等于 parentComment，这时 thread 的 commentNum 也要减 1
      if(replyToComment === parentComment && thread) {
        thread.commentNum = valTool.minusAndMinimumZero(thread.commentNum)
      }
    }
    else if(changeType === "edit" || changeType === "operate") {
      cdData.state = -1
      cdData.targetComment = newComment
    }
    return
  }

  // II. 如果是评论被添加
  if(changeType === "add") {
    if(!newComment) return
    handleCommentAdded(cdData, newComment)
    return
  }

  // III. 检查 belowList 和 aboveList 是否存在 targetId 的被更动的评论
  const _checkList = (list: CommentShow[]) => {
    let hasFound = false
    for(let i=0; i<list.length; i++) {
      const v = list[i]
      if(v._id !== changedId) continue
      hasFound = true
      if(newComment) list[i] = newComment
    }
    return hasFound
  }

  let founded = _checkList(belowList)
  // 若是被删除的评论
  if(founded && changeType === "delete") {
    // 且上级或上上级指向当前目标评论时
    if(targetId === replyToComment || targetId === parentComment) {
      targetComment.commentNum = valTool.minusAndMinimumZero(targetComment.commentNum)
    }
    // 二级评论: replyToComment 等于 parentComment，这时 thread 的 commentNum 也要减 1
    if(replyToComment === parentComment && thread) {
      thread.commentNum = valTool.minusAndMinimumZero(thread.commentNum)
    }
  }

  _checkList(aboveList)
}


// 当有评论被添加时
function handleCommentAdded(
  cdData: CommentDetailData,
  newComment: CommentShow,
) {
  const { 
    targetId,
    targetComment,
    belowList,
    thread,
  } = cdData
  if(!targetComment) return

  const { replyToComment, parentComment } = newComment
  // 若回复的对象，就是当前 targetId
  if(targetId === replyToComment) {
    targetComment.commentNum++
    cdData.belowList.splice(0, 0, newComment)

    // 如果此时 replyToComment 和 parentComment 一致
    // 代表评论为 2 级评论，需要添加 thread 的 commentNum
    if(replyToComment === parentComment && thread) {
      thread.commentNum++
    }
    return
  }

  // 若新评论的 parentComment 为当前 targetId
  if(parentComment === targetId) {
    targetComment.commentNum++
  }

  // 检查 belowList，看有没有要插入的
  for(let i=0; i<belowList.length; i++) {
    const v = belowList[i]
    // 当前 parentComment 匹配，并且 parentComment 与 replyToComment 不同时
    // 把该 parentComment 的 commentNum + 1
    if(v._id === parentComment && replyToComment !== parentComment) {
      v.commentNum++
    }
    if(v._id !== replyToComment) continue

    // 找到 replyToComment，先加大它的 commentNum
    v.commentNum++

    // 再将它的 nextRepliedMe 设为 true
    v.nextRepliedMe = true

    // 判断后一个 item 的 replyToComment 是否也是相同的 replyToComment
    // 若相同，则不添加进该 comments 列表里，要不然会打乱回复关系
    const nextItem = belowList[i + 1]
    const replyToCommentOfNextItem = nextItem?.replyToComment
    if(replyToCommentOfNextItem === replyToComment) break
    belowList.splice(i + 1, 0, newComment)
    break
  }
}


// 几乎与 subscribeTdUpdate.ts 一致
function whenKanbanStateUpdated(
  cdData: CommentDetailData,
  ksc: KanbanStateChange,
) {
  const thread = cdData.thread
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