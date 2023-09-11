import type { HashTagEditorRes } from "~/types/other/types-hashtag"
import type { TagShow } from "~/types/types-content"

export type HteResolver = (res: HashTagEditorRes) => void
export type TagItem = TagShow

