// 接口名称后缀为 LocalTable 的，代表是本地的数据表
import type { OState, VisScope, StorageState } from "./types-basic"
import type { LiuContent, LiuRemindMe, StatusView, TagView } from "./types-atom"
import type { FileLocal, ImageLocal } from "./index"
import type { TipTapJSONContent } from "./types-editor"
import type { EmojiData } from "./types-content"

interface BaseLocalTable {
  _id: string
  cloud_id?: string
  insertedStamp: number
  updatedStamp: number
}

export interface UserLocalTable extends BaseLocalTable{
  oState: "NORMAL"
  lastRefresh: number
  email?: string
  phone?: string
  workspaces: string[]
}

export interface WorkspaceLocalTable extends BaseLocalTable {
  infoType: "ME" | "TEAM"
  statusList?: StatusView[]
  tagList?: TagView[]
  oState: OState
  owner?: string
}

export interface MemberLocalTable extends BaseLocalTable {
  name?: string
  avatar?: ImageLocal
  workspace: string
  user?: string
  oState: "OK" | "LEFT" | "DELETED"
}

export interface ContentLocalTable extends BaseLocalTable {
  infoType: "THREAD" | "COMMENT"
  oState: OState
  user?: string
  member: string
  workspace: string
  visScope: VisScope
  storageState: StorageState
  title?: string
  liuDesc?: LiuContent[]
  images?: ImageLocal[]
  files?: FileLocal[]
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
  tagIds?: string[]
}

export interface DraftLocalTable extends BaseLocalTable {
  infoType: "THREAD" | "COMMENT"
  oState: "OK" | "POSTED" | "DELETED"
  user: string
  workspace: string
  threadEdited?: string
  commentEdited?: string
  underThread?: string
  underComment?: string
  replyComment?: string
  visScope?: VisScope
  storageState?: StorageState
  title?: string
  liuDesc?: TipTapJSONContent[]
  images?: ImageLocal[]
  files?: FileLocal[]
  whenStamp?: number
  remindMe?: LiuRemindMe
  tagIds?: string[]
  editedStamp: number       // 草稿被用户实际编辑的时间戳
}

export interface CollectionLocalTable extends BaseLocalTable {
  user?: string
  member: string
  infoType: "EXPRESS" | "FAVORITE"
  forType: "THREAD" | "COMMENT"
  content_id: string
  emoji?: string
}