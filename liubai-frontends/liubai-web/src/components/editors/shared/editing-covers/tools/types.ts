import type { ImageShow } from '~/types'
import type { LocatedA } from "~/types/other/types-custom"
import type { PropType } from "vue"

export interface EditingCoversProps {
  modelValue?: ImageShow[]
  isInComment: boolean
  located: LocatedA
}

export const ceCoversProps = {
  modelValue: Array<ImageShow>,
  isInComment: {
    type: Boolean,
    default: false,
  },
  located: {
    type: String as PropType<LocatedA>,
    default: "main-view",
  }
}