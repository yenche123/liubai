import type { LocatedA } from "~/types/other/types-custom"
import type { 
  LiuFileStore,
  LiuImageStore,
} from "~/types";
import type { EditorCoreContent } from "~/types/types-editor";

export interface CeProps {
  located: LocatedA  // 位于弹窗内、main-view 或 vice-view
  parentThread: string
  parentComment?: string
  replyToComment?: string
}

export interface CeCtx {
  focused: boolean
  files: LiuFileStore[]
  images: LiuImageStore[]
  isToolbarTranslateY: boolean
  lastInitStamp: number
  canSubmit: boolean
  editorContent?: EditorCoreContent
}

export interface CommentStorageAtom {
  parentThread: string
  parentComment?: string
  replyToComment?: string
  editorContent?: EditorCoreContent
}
