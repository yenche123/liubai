import type { ThreadShow } from '~/types/types-content';
import type { TlViewType } from '../../tools/types';
import type { ThreadOutterOperation } from "~/types/types-atom"
import type { ThreadCardShowType, LiuDisplayType } from "~/types/types-view"
import type { TrueOrFalse } from '~/types/types-basic'

export interface TcProps {
  threadData: ThreadShow
  displayType: LiuDisplayType
  viewType?: TlViewType
  position: number
  showType: ThreadCardShowType
  showTxt?: TrueOrFalse
  isInCommentDetail: boolean
  cssDetectOverflow: boolean
}

export interface TcEmits {
  (
    event: "newoperate", 
    operation: ThreadOutterOperation, 
    position: number, 
    oldThread: ThreadShow
  ): void
  (evt: "requestfocus"): void
  (evt: "tapbriefing"): void
}