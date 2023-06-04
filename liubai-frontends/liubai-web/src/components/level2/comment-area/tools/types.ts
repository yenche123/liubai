
export interface CommentAreaProps {
  threadId: string
  reachBottomNum: number          // 外部触底时（比如滚动），该值 + 1，让
}

export interface CommentAreaEmits {
  (evt: "reachtop"): void         // 【暂时用不到】因为向上加载已交由 comment-context 负责
}