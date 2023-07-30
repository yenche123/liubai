import type { CommentShow } from "~/types/types-content";
import type { WhatDetail } from "~/types/other/types-custom";
import type { CommentOperation } from "~/types/types-atom";

export type CommentCardLocation = WhatDetail | "popup"    // 当前评论所处位置

export interface CommentCardProps {
  cs: CommentShow
  isTargetComment: boolean
  location: CommentCardLocation
  isShowing: boolean   // 跟随 comment-area 或 comment-detail
}

export interface CcCommonEmits {
  (evt: "newoperation", operation: CommentOperation): void
}