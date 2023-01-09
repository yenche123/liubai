import type { ThreadShow } from '~/types/types-content';
import type { 
  TlViewType, 
  TlDisplayType, 
  ThreadOutterOperation 
} from '../../tools/types';

export interface TcProps {
  threadData: ThreadShow
  displayType: TlDisplayType
  viewType: TlViewType
  position: number
}

export interface TcEmits {
  (
    event: "newoperate", 
    operation: ThreadOutterOperation, 
    position: number, 
    oldThread: ThreadShow
  ): void
}

export const tcEmits = {
  newoperate: (operation: ThreadOutterOperation, position: number, oldThread: ThreadShow) => true
}