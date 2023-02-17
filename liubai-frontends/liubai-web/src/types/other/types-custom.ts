
export type WhatDetail = "detail-page" | "vice-view"

export interface ContentConfig {
  showCountdown?: boolean
}

export type SearchType = "thread" | "comment" | "other"

export interface SearchItem {
  itemType: SearchType
  title: string
  desc?: string
  threadId?: string
  commentId?: string
  imageUrl?: string
  svgName?: string
  innerLink?: string   // 可以直接 router.push()
  outterLink?: string  // 外部链接
}