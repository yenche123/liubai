

export type HteMode = "search" | "edit"

export interface HashTagEditorParam {
  text?: string
  mode: HteMode          // search 不可编辑 emoji，edit 时则可以
  icon?: string                     // encodeURIComponent()
}

export interface HashTagEditorRes {
  confirm: boolean
  text?: string     // 已 format 过
  tagId?: string    // 如果是已经创建的 tag，则会有该字段
  icon?: string    // encodeURIComponent()
}


export type TagMovedType = "translate" | "across"    // 平移 / 跨级移动
export type TagChangedType = TagMovedType | "across_rename" | "renamed" | "deleted" | "merged"