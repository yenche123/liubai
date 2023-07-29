import type { LocatedA } from "~/types/other/types-custom"
import type { 
  LiuFileStore,
  LiuImageStore,
} from "~/types";
import type { EditorCoreContent } from "~/types/types-editor";
import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { TipTapEditor } from "~/types/types-editor"

export interface CeProps {
  located: LocatedA  // 位于弹窗内、main-view 或 vice-view
  parentThread: string
  parentComment?: string
  replyToComment?: string
  commentId?: string   // 如果此值存在，代表是编辑，而非发表
  isShowing: boolean
}

export interface CeEmit {
  
  // 当前位置位于弹窗内时，发表完成后需要通知给 popup
  (evt: "finished"): void

}

export interface CeCtx {
  focused: boolean
  files: LiuFileStore[]
  images: LiuImageStore[]
  isToolbarTranslateY: boolean
  lastInitStamp: number
  lastFinishStamp: number
  canSubmit: boolean
  fileShowName: string
  editorContent?: EditorCoreContent
}

export interface CommentStorageAtom {
  parentThread: string
  parentComment?: string
  replyToComment?: string
  editorContent?: EditorCoreContent
  files?: LiuFileStore[]
  images?: LiuImageStore[]
}

export type CommentStorageType = "content" | "image" | "file"

export interface HcCtx {
  wStore: WorkspaceStore
  ceCtx: CeCtx
  props: CeProps
  emit: CeEmit
  editor: TipTapEditor
  user: string
}