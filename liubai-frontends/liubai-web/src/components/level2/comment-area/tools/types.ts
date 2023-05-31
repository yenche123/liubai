
export interface CommentAreaProps {
  threadId: string
  targetCommentId?: string        // 目标 id
  reachBottomNum: number          // 外部触底时（比如滚动），该值 + 1，让
}

export interface CommentAreaEmits {
  (evt: "reachtop"): void
}