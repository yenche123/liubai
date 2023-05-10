import type { ImageShow } from '~/types';

export interface PiParam {
  imgs: ImageShow[]
  index?: number
  viewTransitionName?: string
}

export interface PreviewImageRes {
  hasBack: boolean
}

export interface PiData {
  imgs: ImageShow[]
  index: number
  viewTransitionName?: string
}

export type PiResolver = (res: PreviewImageRes) => void