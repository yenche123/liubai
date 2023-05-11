import type { ImageShow } from '~/types';
import { Swiper } from "swiper"

export interface PicProps {
  imgs: ImageShow[]
  currentIndex: number
  viewTransitionName?: string
}

export const picProps = {
  imgs: {
    type: Array<ImageShow>,
    default: [],
  },
  currentIndex: {
    type: Number,
    default: 0,
  },
  viewTransitionName: {
    type: String,
  }
}

export interface PicEmits {
  (event: "swiper", swiper: Swiper): void
}

export const picEmits = {
  swiper: (swiper: Swiper) => true
}

export interface PicCover {
  src: string
  id: string
  width: number
  height: number
  blurhash?: string
}