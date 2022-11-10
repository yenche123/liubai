import type { LiuRemindMe } from "../../../types/types-atom";
import type { StorageState, VisScope } from "../../../types/types-basic";
import type { ImageLocal, FileLocal } from "../../../types"
import { TipTapJSONContent } from "../../../types/types-editor";

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
  descInited?: TipTapJSONContent[]  // 只在初始化时 从 initCeState 传递给 useCeState 所使用！
}