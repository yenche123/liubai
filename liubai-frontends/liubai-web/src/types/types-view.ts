


export type OpenType = "closed_by_user" | "closed_by_auto" | "opened"

export type ThreadListViewType = "TRASH" | "TAG" | "FAVORITE"
  | "PINNED" | "INDEX" | "STATE" | ""

export type ThreadCardShowType = "normal" | "hiding"

export type CursorHorizontalResize = "ew-resize" | "e-resize" | "w-resize"

// 自定义页面内的视图单元
export interface BasicView {
  show: boolean
  id: string
}