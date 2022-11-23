
export type HteMode = "search" | "rename"

export interface HashTagEditorParam {
  text?: string
  mode: HteMode          // 前者不可编辑 emoji，后者则可以
  icon?: string                     // encodeURIComponent()
}

export interface HashTagEditorRes {
  confirm: boolean
  text?: string
  tagId?: string    // 如果是已经创建的 tag，则会有该字段
  icon?: string    // encodeURIComponent()
}

export type HteResolver = (res: HashTagEditorRes) => void

export interface TagItem {
  tagId: string
  textBlank: string       // 该字段的文字里， "/" 前后会有空格，变成 "xxxx / yyyy / zzzzz"
  emoji?: string          // 直接就是 emoji 字符串，无需编解码
} 

