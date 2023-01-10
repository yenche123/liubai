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
  lastInitStamp?: number       // 上一次重新赋值 init 的时间戳
}

export const defaultState: CeState = {
  infoType: "THREAD",
  visScope: "DEFAULT",
  storageState: "CLOUD",
  tagIds: []
}


export interface CeEmits {
   // 当前为 编辑状态时，并且查无该动态（包含草稿）则 emit 此事件
  (event: "nodata", threadId: string): void

  // 当前为 编辑状态时，并且查到了该动态，则 emit 此事件
  (event: "hasdata", threadId: string): void

  // 动态已更新
  (event: "updated", threadId: string): void
}