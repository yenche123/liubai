// 全局通知评论发生变化
// 比如:
// 1. 添加评论: 
//      告知某个 id 的 threadShow 或 commentShow ，让其 commentNum +1
// 2. 删除评论: 
//      告知某个 id 的 threadShow 或 commentShow ，让其 commentNum -1
// 3. 编辑评论:
//      刷新某个 comment

import { ref } from "vue";
import { defineStore } from "pinia";
import type { CommentShow } from "~/types/types-content";

export type CommentChangeType = "add" | "delete" | "edit"

export interface CommentStoreSetDataOpt {
  changeType: CommentChangeType
  commentId: string
  commentShow: CommentShow
  parentThread: string
  parentComment?: string
  replyToComment?: string
}

export const useCommentStore = defineStore("comment", () => {
  const changeType = ref<CommentChangeType | "">("")
  const commentId = ref("")

  // 被删除时，该变量依然有值，只不过是干净的 commentShow，伴随着 oState 等于 DELETED
  const commentShow = ref<CommentShow>()

  const parentThread = ref("")
  const parentComment = ref("")
  const replyToComment = ref("")

  const setData = (opt: CommentStoreSetDataOpt) => {
    changeType.value = opt.changeType
    commentId.value = opt.commentId
    commentShow.value = opt.commentShow
    parentThread.value = opt.parentThread
    parentComment.value = opt.parentComment ?? ""
    replyToComment.value = opt.replyToComment ?? ""
  }

  return {
    changeType,
    commentId,
    commentShow,
    parentThread,
    parentComment,
    replyToComment,
    setData,
  }
})

export type CommentStore = ReturnType<typeof useCommentStore>

export interface CommentStoreState {
  changeType: CommentChangeType | ""
  commentId: string
  commentShow?: CommentShow
  parentThread: string
  parentComment: string
  replyToComment: string
}