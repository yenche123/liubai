import type { ThreadShow } from '~/types/types-content';
import type { 
  TlViewType, 
  TlDisplayType,  
} from '../../tools/types';
import type { ThreadOutterOperation } from "~/types/types-atom"
import type { ThreadCardShowType } from "~/types/types-view"
import type { TrueOrFalse } from '~/types/types-basic'

export interface TcProps {
  threadData: ThreadShow
  displayType: TlDisplayType
  viewType: TlViewType
  position: number
  showType: ThreadCardShowType
  showTxt?: TrueOrFalse
  isInCommentDetail: boolean
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