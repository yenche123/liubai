import type { LiuRemindMe, ContentInfoType } from "~/types/types-atom";
import type { StorageState, VisScope } from "~/types/types-basic";
import type { LiuFileStore, LiuImageStore } from "~/types"
import type { EditorCoreContent } from "~/types/types-editor";

export interface CeData {
  draftId?: string
  infoType: ContentInfoType
  threadEdited?: string     // 已发表的动态的 id，表示是编辑该动态
  visScope: VisScope
  storageState: StorageState
  title?: string
  whenStamp?: number
  remindMe?: LiuRemindMe
  images?: LiuImageStore[]
  files?: LiuFileStore[]
  tagIds: string[]
  editorContent?: EditorCoreContent
  lastTagChangeStamp?: number
  lastLockStamp?: number     // 锁定时间戳，避免去存储 draft
  lastEditStamp?: number
  showTitleBar: boolean
  canSubmit: boolean
  reject_draft_ids?: string[]
}

export const defaultData: CeData = {
  infoType: "THREAD",
  visScope: "DEFAULT",
  storageState: "CLOUD",
  tagIds: [],
  showTitleBar: false,
  canSubmit: false,
}

export interface CeProps {
  forceUpdateNum: number  // let edit-content force me to update
  threadId?: string
}

export const ceProps = {
  forceUpdateNum: {
    type: Number,
    default: 0,
  },
  threadId: String
}

export interface CeEmits {
   // 当前为 编辑状态时，并且查无该动态（包含草稿）则 emit 此事件
  (event: "nodata", threadId: string): void

  // 当前为 编辑状态时，并且查到了该动态，则 emit 此事件
  (event: "hasdata", threadId: string): void

  // 动态已更新
  (event: "updated", threadId: string): void

  // 当用户开始打字发生编辑时
  (event: "editing"): void
}