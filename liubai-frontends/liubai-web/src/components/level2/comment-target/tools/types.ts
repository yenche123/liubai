import type { WhatDetail } from '~/types/other/types-custom';
import type { PageState } from '~/types/types-atom';
import type { CommentShow, ThreadShow } from '~/types/types-content';

export interface CommentTargetData {
  targetId: string
  state: PageState
  targetComment?: CommentShow
  aboveList: CommentShow[]      // 在 targetComment 之上的评论
  belowList: CommentShow[]      // 在 targetComment 之下的评论
  thread?: ThreadShow           // 加载到最顶部就是 thread
}

export interface CommentTargetProps {
  location: WhatDetail
  targetId: string
}

export interface CommentTargetEmit {
  (evt: "pagestatechange", state: PageState): void
}

