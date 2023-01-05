import type {
  HashTagEditorRes,
} from "~/types/other/types-hashtag"

export type HteResolver = (res: HashTagEditorRes) => void

export interface TagItem {
  tagId: string
  textBlank: string       // 该字段的文字里， "/" 前后会有空格，变成 "xxxx / yyyy / zzzzz"
  emoji?: string          // 直接就是 emoji 字符串，无需编解码
} 

