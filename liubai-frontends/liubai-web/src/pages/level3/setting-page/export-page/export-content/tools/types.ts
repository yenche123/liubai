import type { 
  SpaceType, 
  VisScope, 
  StorageState,
} from "~/types/types-basic"
import type { 
  LiuContent, 
  LiuRemindMe,
} from "~/types/types-atom"
import type { EmojiData } from "~/types/types-content"
import type { 
  ContentConfig, 
} from "~/types/other/types-custom"


export interface GetDataOpt {
  spaceId: string
  limit: number
  lastItemStamp?: number
}

export type ExportType = "md" | "json"

// 导出格式为 json 时的结构: 
export interface LiuExportContentJSON {
  infoType: "THREAD" | "COMMENT"
  user?: string
  member: string
  spaceId: string
  spaceType: SpaceType
  visScope: VisScope
  storageState: StorageState
  title?: string
  liuDesc?: LiuContent[]
  imageNames?: string[]
  fileNames?: string[]
  calendarStamp?: number
  remindStamp?: number
  whenStamp?: number
  remindMe?: LiuRemindMe
  commentNum?: number
  emojiData: EmojiData
  underThread?: string
  replyTo?: string
  pinStamp?: number         // 被置顶时的时间戳
  createdStamp: number      // 动态被创建的时间戳
  editedStamp: number       // 动态被编辑的时间戳
  tagIds?: string[]         // 用于显示的 tagId
  tagSearched?: string[]      // 用于搜索的 tagId 要把 tagIds 的 parent id 都涵盖进来
  stateId?: string
  config?: ContentConfig
}