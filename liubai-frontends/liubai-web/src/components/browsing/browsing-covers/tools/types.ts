import type { ImageShow } from '~/types';
import type { ImgLayout } from "~/types/other/types-custom"
import type { PropType } from "vue"


export type BcPurpose = "thread" | "comment" | "import"

export interface BrowsingCoversProps {
  covers?: ImageShow[]
  imgLayout?: ImgLayout
  purpose: BcPurpose
}

export const browsingCoversProps = {
  covers: {
    type: Array<ImageShow>,
  },
  imgLayout: {
    type: Object as PropType<ImgLayout>,
  },
  purpose: {
    type: String as PropType<BcPurpose>,
    default: "thread"
  }
}