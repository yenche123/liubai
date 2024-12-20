import type { ImageShow } from '~/types';
import { SimpleFunc } from '~/utils/basic/type-tool';

export interface PiParam {
  imgs: ImageShow[]
  index?: number
  viewTransition?: boolean
  viewTransitionCallbackWhileShowing?: SimpleFunc
  viewTransitionCallbackWhileClosing?: (currentIdx: number) => void
  viewTransitionBorderRadius?: string
}

export interface PreviewImageRes {
  hasBack: boolean
}

export interface PiData {
  imgs: ImageShow[]
  index: number
  viewTransition?: boolean
  viewTransitionCallbackWhileShowing?: SimpleFunc
  viewTransitionCallbackWhileClosing?: (currentIdx: number) => void
}

export type PiResolver = (res: PreviewImageRes) => void

export type ViewTransitionResolver = (res: true) => void