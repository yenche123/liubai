import type { CommentShow } from "~/types/types-content"
import type { CommentCardLocation } from "../../tools/types"

export interface CcBubbleBarProps {
  show: boolean
  location: CommentCardLocation
  cs: CommentShow
}