import type { CommentEditorLocated } from "~/types/other/types-custom"
import type { 
  LiuFileStore,
  LiuImageStore,
} from "~/types";
import type { EditorCoreContent } from "~/types/types-editor";

export interface CeProps {
  located: CommentEditorLocated  // 位于弹窗内、main-view 或 vice-view
}

export interface CeCtx {
  focused: boolean
  files: LiuFileStore[]
  images: LiuImageStore[]
  editorContent?: EditorCoreContent
}