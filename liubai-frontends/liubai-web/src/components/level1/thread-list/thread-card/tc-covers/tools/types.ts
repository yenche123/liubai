import type { ImageShow } from '~/types';
import type { ImgLayout } from "~/types/other/types-custom"
import type { PropType } from "vue"

export interface TcCoversProps {
  covers?: ImageShow[]
  imgLayout?: ImgLayout
}

export const tcCoversProps = {
  covers: {
    type: Array<ImageShow>,
  },
  imgLayout: {
    type: Object as PropType<ImgLayout>,
  }
}