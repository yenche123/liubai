

export type HteMode = "search" | "rename"

export interface HashTagEditorParam {
  text?: string
  mode: HteMode          // 前者不可编辑 emoji，后者则可以
  icon?: string                     // encodeURIComponent()
}

export interface HashTagEditorRes {
  confirm: boolean
  text?: string     // 已 format 过
  tagId?: string    // 如果是已经创建的 tag，则会有该字段
  icon?: string    // encodeURIComponent()
}


export type TagMovedType = "translate" | "across"    // 平移 / 跨级移动
export type TagChangedType = TagMovedType | "renamed" | "deleted" | "merged"