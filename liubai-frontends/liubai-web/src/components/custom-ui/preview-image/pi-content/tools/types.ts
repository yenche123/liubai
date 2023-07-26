import type { ImageShow } from '~/types';
import type { Swiper } from "swiper"
import type { Ref } from 'vue';

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
  (evt: "swiper", swiper: Swiper): void
  (evt: "cancel"): void
}

export interface PicCover {
  src: string
  id: string
  width: number
  height: number
  blurhash?: string
}

export interface PicCtx {
  swiper?: Swiper
  props: PicProps
  emit: PicEmits
  zoomScale: Ref<number>    // 当前缩放的比例，默认为 1
}