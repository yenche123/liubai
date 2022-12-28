import type { ThreadShow } from '../../../../../types/types-content';
import { TlViewType, TlDisplayType } from '../../tools/types';

export interface TcProps {
  threadData: ThreadShow
  displayType: TlDisplayType
  viewType: TlViewType
  position: number
}