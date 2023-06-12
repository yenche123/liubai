import type { WhatDetail } from "~/types/other/types-custom"
import type { CommentShow } from "~/types/types-content"

export interface CommentAreaData {
  comments: CommentShow[]
  threadId: string
}

export interface CommentAreaProps {
  threadId: string
  reachBottomNum: number          // 外部触底时（比如滚动），该值 + 1，让
  location: WhatDetail
}

export interface CommentAreaEmits {
  (evt: "reachtop"): void         // 【暂时用不到】因为向上加载已交由 comment-context 负责
}