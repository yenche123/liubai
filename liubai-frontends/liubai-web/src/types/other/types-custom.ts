
export type WhatDetail = "detail-page" | "vice-view"

export type LocatedA = "popup" | "vice-view" | "main-view"

export interface ContentConfig {
  showCountdown?: boolean
  allowComment?: boolean
  lastToggleCountdown?: number
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

export interface MemberConfig {
  searchKeywords: string[]
  searchTagIds?: string[]
}

export interface ImgOneLayout {
  heightStr: string           // 整个盒子的高度，比如 80% （相对于宽度）
  maxWidthPx: number          // 整个 covers 盒子的最大宽度，单位 px
}

export interface ImgTwoLayout extends ImgOneLayout {
  isColumn?: boolean          // 是否 竖直排列
}

export interface ImgLayout {
  one?: ImgOneLayout
  two?: ImgTwoLayout
}

export interface CryptoCipherAndIV {
  cipherText: string
  iv: string
}