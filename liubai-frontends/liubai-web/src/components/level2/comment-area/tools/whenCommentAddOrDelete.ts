
import valTool from "~/utils/basic/val-tool"
import type {
  CommentAreaData,
} from "./types"
import type { CommentStoreState } from "~/hooks/stores/useCommentStore"


/** 当 comment-area 监听到 comment-store 发生变化时
 *   相应地做一些处理，比如添加 / 编辑 / 删除 item 
 */
export function whenCommentAddOrDelete(
  caData: CommentAreaData,
  state: CommentStoreState,
) {
  const { 
    changeType, 
    commentId, 
    parentThread,
  } = state

  if(!changeType || !commentId) return

  const threadId = caData.threadId
  if(!threadId || threadId !== parentThread) return

  if(changeType === "add") {
    handleAdded(caData, state)
  }
  else if(changeType === "delete" || changeType === "edit") {
    handleEditedOrDeleted(caData, state)
  }
}


function handleAdded(
  caData: CommentAreaData,
  state: CommentStoreState,
) {
  const {
    parentComment,
    replyToComment,
    commentShow,
  } = state

  if(!commentShow) return

  const { comments } = caData
  const newComment = valTool.copyObject(commentShow)

  // 0. 如果没有 replyToComment，代表为一级评论，直接添加到最前面
  if(!replyToComment) {
    comments.splice(0, 0, newComment)
    return
  }

  // 1. 尝试寻找 replyToComment
  for(let i=0; i<comments.length; i++) {
    const v = comments[i]

    // 当前 parentComment 匹配，并且 parentComment 与 replyToComment 不同时
    // 把该 parentComment 的 commentNum + 1
    if(v._id === parentComment && replyToComment !== parentComment) {
      v.commentNum++
    }


    if(v._id !== replyToComment) continue
    
    // 找到 replyToComment，先加大它的 commentNum
    v.commentNum++

    // 判断后一个 item 的 replyToComment 是否也是相同的 replyToComment
    // 若相同，则不添加进该 comments 列表里，要不然会打乱回复关系
    const nextItem = comments[i + 1]
    const replyToCommentOfNextItem = nextItem?.replyToComment
    if(replyToCommentOfNextItem === replyToComment) break
    comments.splice(i + 1, 0, newComment)
    break
  }

}

function handleEditedOrDeleted(
  caData: CommentAreaData,
  state: CommentStoreState,
) {
  const {
    commentId,
    changeType,
    parentComment,
    replyToComment,
    commentShow,
  } = state
  
  if(!commentShow) return

  const { comments } = caData
  if(comments.length < 1) return

  const theComment = valTool.copyObject(commentShow)

  for(let i=0; i<comments.length; i++) {
    const v = comments[i]

    // 读到 parentComment / replyToComment，若是删除的情况，把 commentNum 减 1
    if(v._id === parentComment || v._id === replyToComment) {
      if(changeType === "delete") {
        v.commentNum--
      }
    }

    if(commentId !== v._id) continue

    // 此时，找到被操作的那条评论了

    // 如果是编辑，那么直接赋值
    if(changeType === "edit") {
      comments[i] = theComment
      break
    }

    const nextItem = comments[i + 1]
    const replyToCommentOfNextItem = nextItem?.replyToComment

    // 若后一个 item 的回复对象就是当前被删除的评论，那么使用赋值的方式
    // 这样界面上就会如此呈现: "该评论已被删除"，而不会打乱上下文
    if(replyToCommentOfNextItem === commentId) {
      comments[i] = theComment
      break
    }

    // 其他删除方式，都使用自列表中移除
    comments.splice(i, 1)
    break
  }

}