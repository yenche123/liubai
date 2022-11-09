import type { LiuRemindMe, LiuContent } from "../../../types/types-atom";
import type { StorageState, VisScope } from "../../../types/types-basic";

export interface CeState {
  draftId?: string
  infoType: "THREAD" | "COMMENT"
  threadEdited?: string
  visScope: VisScope
  storageState: StorageState
  title?: string
  whenStamp?: number
  remindMe?: LiuRemindMe
}