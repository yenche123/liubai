import type { CommentShow } from "~/types/types-content"
import type { 
  CommentCardLocation, 
  CcCommonEmits,
  CommentCardReaction
} from "../../tools/types"

export interface CcBubbleBarProps {
  show: boolean
  location: CommentCardLocation
  cs: CommentShow
  myReaction?: CommentCardReaction
}


export interface CcBubbleBarEmits extends CcCommonEmits {}