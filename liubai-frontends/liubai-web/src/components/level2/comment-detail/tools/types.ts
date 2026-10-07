import type { WhatDetail } from '~/types/other/types-custom';
import type { PageState } from '~/types/types-atom';
import type { CommentShow, ThreadShow } from '~/types/types-content';
import type { Ref } from "vue"

export interface CommentDetailData {
  targetId: string
  state: PageState
  targetComment?: CommentShow
  aboveList: CommentShow[]      // 在 targetComment 之上的评论
  belowList: CommentShow[]      // 在 targetComment 之下的评论
  thread?: ThreadShow           // 加载到最顶部就是 thread
  hasReachedBottom: boolean
  hasReachedTop: boolean
  loadingAbove: boolean
  loadingBelow: boolean
  loadGeneration: number
  aboveLoadGeneration: number
  belowLoadGeneration: number
  focusNum: number
  lastLockStamp: number
  networkLevel: number
}

export interface CommentDetailProps {
  location: WhatDetail
  targetId: string
  isShowing: boolean
}

export interface CommentDetailEmit {
  (evt: "pagestatechange", state: PageState): void
}

export interface CommentDetailCtx {
  cdData: CommentDetailData
  svEl?: Ref<HTMLElement | null>
  scrollPosition: Ref<number>
  emit: CommentDetailEmit
}
