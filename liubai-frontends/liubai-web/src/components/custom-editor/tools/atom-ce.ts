import type { LiuRemindMe } from "../../../types/types-atom";
import type { StorageState, VisScope } from "../../../types/types-basic";
import type { ImageLocal, FileLocal } from "../../../types"
import type { EditorCoreContent } from "../../../types/types-editor";

export interface CeState {
  draftId?: string
  infoType: "THREAD" | "COMMENT"
  threadEdited?: string
  visScope: VisScope
  storageState: StorageState
  title?: string
  whenStamp?: number
  remindMe?: LiuRemindMe
  images?: ImageLocal[]
  files?: FileLocal[]
  tagIds: string[]
  editorContent?: EditorCoreContent
  lastTagChangeStamp?: number
}

export const defaultState: CeState = {
  infoType: "THREAD",
  visScope: "DEFAULT",
  storageState: "CLOUD",
  tagIds: []
}