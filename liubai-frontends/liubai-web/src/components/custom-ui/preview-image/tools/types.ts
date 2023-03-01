import type { ImageShow } from '~/types';

export interface PiParam {
  imgs: ImageShow[]
  index?: number
}

export interface PreviewImageRes {
  hasBack: boolean
}

export interface PiData {
  imgs: ImageShow[]
  index: number
}

export type PiResolver = (res: PreviewImageRes) => void