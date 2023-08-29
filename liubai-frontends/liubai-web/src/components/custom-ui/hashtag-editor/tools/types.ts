import type {
  HashTagEditorRes,
} from "~/types/other/types-hashtag"
import type { TagSearchItem } from "~/utils/system/tag-related/tools/types"

export type HteResolver = (res: HashTagEditorRes) => void
export type TagItem = TagSearchItem

