
export type WhatDetail = "detail-page" | "vice-view"

export type LocatedA = "popup" | "vice-view" | "main-view"

export interface ContentConfig {
  showCountdown?: boolean
  allowComment?: boolean
  lastToggleCountdown?: number  // last stamp when user toggle showCountdown
  lastOStateStamp?: number           // last stamp when user edited oState
  lastOperateStateId?: number     // last stamp when user edited stateId
  lastOperatePin?: number        // last stamp when user edited pin
  lastOperateTag?: number        // last stamp when user edited tag
  lastOperateWhenRemind?: number   // last stamp when user 
                                   // edited whenStamp / remindStamp / remind
  lastUpdateEmojiData?: number      // last stamp when emojiData is updated
  lastUpdateLevelNum?: number   // last stamp when levelOne or 
                                // levelOneAndTwo is updated
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

export interface WorkspaceConfig {
  // last stamp when user edited tagList of workspace
  lastOperateTag?: number
}

export interface MemberConfig {
  searchKeywords?: string[]
  searchTagIds?: string[]
  lastOperateName?: number     // last stamp when user edited name
}

export interface MemberNotification {
  ww_qynb_toggle?: boolean
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