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

export interface CommentCardReaction {
  iconName: string
  emoji: string      // 直接就是表情符号，无需转码/解码
}

export interface CcReactionItem {
  iconName: string
  emoji: string     // 直接就是表情符号，无需转码/解码
  emojiEncoded: string     // encodeURIComponent(emoji)，用于 v-for 的 :key
  num: number
  chosen: boolean
}

export interface CcData {
  reactionList: CcReactionItem[]
  myReaction: CommentCardReaction
}

export interface CcCommonEmits {
  (evt: "newoperation", operation: CommentOperation): void
}