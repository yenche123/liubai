import type { ThreadListViewType, ThreadCardShowType } from "~/types/types-view"
import type { TrueOrFalse } from "~/types/types-basic"
import type { ThreadShow } from "~/types/types-content"
import type { Ref, ShallowRef, PropType } from "vue"
import type { SvBottomUp } from "~/types/components/types-scroll-view"

export type TlViewType = ThreadListViewType
// 要多一个 INDEX 类型是因为，此时要过滤 pinned 的动态

export interface TlAtom {
  thread: ThreadShow
  showType: ThreadCardShowType
  dateText?: string     // which is for calendar TODAY_FUTURE & PAST
}

export interface TlData {
  list: TlAtom[]
  lastItemStamp: number
  hasReachedBottom: boolean
  requestRefreshNum: number    // 非 useThreadList 的函数，请求 useThreadList 去 loadList
  cssDetectOverflow: boolean
  title_key?: string
}

export interface TlProps {
  viewType: TlViewType
  tagId: string
  stateId: string
  showTxt?: TrueOrFalse
}

export interface TlHasDataOpt {
  title_key?: string
}

export interface TlEmits {
  (event: "nodata"): void
  (event: "hasdata", opt?: TlHasDataOpt): void
}

export interface TlContext {
  tlData: TlData,
  spaceIdRef: Ref<string>
  svBottomUp?: ShallowRef<SvBottomUp>
  reloadRequired: boolean
  emits: TlEmits
  props: TlProps
  scrollPosition?: Ref<number>
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