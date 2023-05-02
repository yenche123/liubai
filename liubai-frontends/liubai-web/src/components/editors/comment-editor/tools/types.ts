import type { CommentEditorLocated } from "~/types/other/types-custom"

export interface CeProps {
  located: CommentEditorLocated  // 位于弹窗内、main-view 或 vice-view
}

export interface CeCtx {
  activated: boolean
}