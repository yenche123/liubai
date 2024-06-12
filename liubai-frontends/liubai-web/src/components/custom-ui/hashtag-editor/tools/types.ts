import type { HashTagEditorRes, HteMode } from "~/types/other/types-hashtag"
import type { TagShow } from "~/types/types-content"


export interface HteData {
  enable: boolean
  show: boolean
  transDuration: number
  inputTxt: string         // 输入框里的文字
  nativeInputTxt: string
  emoji: string            // 输入框左侧的 emoji
  errCode: number          // 错误提示. 1: 不得输入奇怪的字符; 2: 最多若干个 "/"
  newTag: string           // 可以被创建的标签，注意该文字不能回传到业务侧，因为它的结构为 "xxx / yyy / zzz"
  list: TagShow[]
  selectedIndex: number    // 被选择的 index
  mode: HteMode | ""
  recentTagIds: string[]
}

export type HteResolver = (res: HashTagEditorRes) => void
export type TagItem = TagShow

