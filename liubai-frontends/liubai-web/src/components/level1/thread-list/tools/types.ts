import type { ThreadListViewType } from "~/types/types-view"
import type { PropType } from "vue"
import type { TrueOrFalse } from "~/types/types-basic"

export type TlViewType = ThreadListViewType
// 要多一个 INDEX 类型是因为，此时要过滤 pinned 的动态

export interface TlProps {
  viewType: string
  tagId: string
  stateId: string
  showTxt?: TrueOrFalse
}

export type TlDisplayType = "list" | "detail"

export interface TlEmits {
  (event: "nodata"): void
  (event: "hasdata"): void
}

export const tlProps = {
  viewType: {
    type: String as PropType<TlViewType>,
    default: "",
  },
  tagId: {
    type: String,
    default: "",
  },
  stateId: {
    type: String,
    default: "",
  },
  showTxt: {
    type: String as PropType<TrueOrFalse>
  }
}