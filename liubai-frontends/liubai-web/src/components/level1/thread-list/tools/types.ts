import type { ThreadListViewType, ThreadCardShowType } from "~/types/types-view"
import type { PropType } from "vue"
import type { TrueOrFalse } from "~/types/types-basic"
import type { ThreadShow } from "~/types/types-content"
import type { Ref, ShallowRef } from "vue"
import type { SvBottomUp } from "~/types/components/types-scroll-view"

export type TlViewType = ThreadListViewType
// 要多一个 INDEX 类型是因为，此时要过滤 pinned 的动态

export interface TlAtom {
  thread: ThreadShow
  showType: ThreadCardShowType
}

export interface TlData {
  list: TlAtom[]
  lastItemStamp: number
  hasReachBottom: boolean
}

export interface TlProps {
  viewType: TlViewType
  tagId: string
  stateId: string
  showTxt?: TrueOrFalse
}

export type TlDisplayType = "list" | "detail"

export interface TlEmits {
  (event: "nodata"): void
  (event: "hasdata"): void
}

export interface TlContext {
  tlData: TlData,
  spaceIdRef: Ref<string>
  showNum: number
  svBottomUp?: ShallowRef<SvBottomUp>
  reloadRequired: boolean
  emits: TlEmits
  props: TlProps
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