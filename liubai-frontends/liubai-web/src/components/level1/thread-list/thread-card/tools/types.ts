import type { ThreadShow } from '~/types/types-content';
import type { 
  TlViewType, 
  TlDisplayType,  
} from '../../tools/types';
import type { ThreadOutterOperation } from "~/types/types-atom"
import type { ThreadCardShowType } from "~/types/types-view"

export interface TcProps {
  threadData: ThreadShow
  displayType: TlDisplayType
  viewType: TlViewType
  position: number
  showType: ThreadCardShowType
}

export interface TcEmits {
  (
    event: "newoperate", 
    operation: ThreadOutterOperation, 
    position: number, 
    oldThread: ThreadShow
  ): void
}