import type { ImageShow } from '~/types';
import type { ImgLayout } from "~/types/other/types-custom"
import type { PropType } from "vue"

export interface BrowsingCoversProps {
  covers?: ImageShow[]
  imgLayout?: ImgLayout
}

export const browsingCoversProps = {
  covers: {
    type: Array<ImageShow>,
  },
  imgLayout: {
    type: Object as PropType<ImgLayout>,
  }
}