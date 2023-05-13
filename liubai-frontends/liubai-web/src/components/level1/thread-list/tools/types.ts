import type { ThreadListViewType } from "~/types/types-view"

export type TlViewType = ThreadListViewType
// 要多一个 INDEX 类型是因为，此时要过滤 pinned 的动态

export interface TlProps {
  viewType: string
  tagId: string
  stateId: string
}

export type TlDisplayType = "list" | "detail"

export interface TlEmits {
  (event: "nodata"): void
  (event: "hasdata"): void
}