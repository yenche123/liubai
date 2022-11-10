import type { LiuRemindMe } from "../../../types/types-atom";
import type { StorageState, VisScope } from "../../../types/types-basic";
import type { ImageLocal, FileLocal } from "../../../types"

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
}