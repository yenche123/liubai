// 接口名称后缀为 LocalTable 的，代表是本地的数据表
import type { OState, VisScope, StorageState } from "./types-basic"
import type { LiuContent, LiuRemindMe, StatusView, TagView } from "./types-atom"
import type { FileLocal, ImageLocal } from "./index"
import type { TipTapJSONContent } from "./types-editor"

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
  owner: string
}

export interface MemberLocalTable extends BaseLocalTable {
  name?: string
  avatar?: {
    file: File
    url?: string
    url0?: string
  }
  workspace: string
  user: string
  oState: "OK" | "LEFT" | "DELETED"
}

export interface ContentLocalTable extends BaseLocalTable {
  infoType: "THREAD" | "COMMENT"
  oState: "OK" | "REMOVED" | "DELETED"
  user: string
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
  createdStamp: number      // 动态被创建的时间戳
  editedStamp: number       // 动态被编辑的时间戳
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
  editedStamp: number       // 草稿被用户实际编辑的时间戳
}

export interface CollectionLocalTable extends BaseLocalTable {
  user: string
  infoType: "EXPRESS" | "FAVORITE"
  forType: "THREAD" | "COMMENT"
  thread_id?: string
  comment_id?: string
  emoji?: string
}