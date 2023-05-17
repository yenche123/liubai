
import type { 
  SpaceType, 
  VisScope, 
  StorageState,
} from "../types-basic"
import type { 
  LiuContent, 
  LiuRemindMe,
} from "../types-atom"
import type { EmojiData } from "../types-content"
import type { 
  ContentConfig, 
} from "./types-custom"
import type { BaseLocalTable } from "../types-table"
import type { LiuFileStore, LiuImageStore } from "../index"

export type LiuFileExport = Omit<LiuFileStore, "arrayBuffer" | "cloud_url">
export type LiuImageExport = Omit<LiuImageStore, "arrayBuffer" | "cloud_url">

// 导出格式为 json 时的结构: 
export interface LiuExportContentJSON extends BaseLocalTable {
  infoType: "THREAD" | "COMMENT"
  user: string
  member?: string
  spaceId: string
  spaceType: SpaceType
  visScope: VisScope
  storageState: StorageState
  title?: string
  liuDesc?: LiuContent[]
  images?: LiuImageExport[]
  files?: LiuFileExport[]
  calendarStamp?: number
  remindStamp?: number
  whenStamp?: number
  remindMe?: LiuRemindMe
  emojiData: EmojiData
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  pinStamp?: number         // 被置顶时的时间戳
  createdStamp: number      // 动态被创建的时间戳
  editedStamp: number       // 动态被编辑的时间戳
  tagIds?: string[]         // 用于显示的 tagId
  tagSearched?: string[]      // 用于搜索的 tagId 要把 tagIds 的 parent id 都涵盖进来
  stateId?: string
  config?: ContentConfig
  levelOne?: number         // 一级评论数
  levelOneAndTwo?: number   // 一级 + 二级评论数
}