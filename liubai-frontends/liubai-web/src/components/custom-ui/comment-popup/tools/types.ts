import type {
  CommentShow,
  ThreadShow,
} from "~/types/types-content"

export type CommentPopupOperation = "edit_comment" | "reply_thread" | "reply_comment"

export interface CommentPopupParam {
  operation: CommentPopupOperation
  threadShow?: ThreadShow      // operation 为 reply_thread 时，必填
  commentShow?: CommentShow    // operation 为 edit_comment 和 reply_comment 时，必填
}

export interface CommentPopupData {
  enable: boolean
  show: boolean
  transDuration: number    // 过度动画的毫秒数
  operation: CommentPopupOperation
  parentThread: string
  commentShow?: CommentShow
  threadShow?: ThreadShow
  csTsPretend?: CommentShow     // 假装成 CommentShow 的 threadShow
                                // ThreadShow pretends to be CommentShow

  // 传递给 comment-editor 组件的字段
  parentComment?: string
  replyToComment?: string
  commentId?: string

  // 聚焦的次数
  focusNum: number

  // 是否显示右上角的完成按钮
  rightTopBtn: boolean

  // 是否可以点击完成
  canSubmit: boolean

  // 请求 editor 执行完成事件
  submitNum: number

}