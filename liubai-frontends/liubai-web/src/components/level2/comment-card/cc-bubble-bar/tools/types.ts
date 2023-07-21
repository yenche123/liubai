import type { CommentShow } from "~/types/types-content"
import type { CommentCardLocation, CcCommonEmits } from "../../tools/types"

export interface CcBubbleBarProps {
  show: boolean
  location: CommentCardLocation
  cs: CommentShow
}


export interface CcBubbleBarEmits extends CcCommonEmits {}