// 接口名称后缀为 LocalTable 的，代表是本地的数据表
import type { OState, VisScope, StorageState } from "./types-basic"
import type { LiuContent, LiuRemindMe, StatusView, TagView } from "./types-atom"
import type { FileLocal, ImageLocal } from "./index"

export interface UserLocalTable {
  _id: string
  user_id?: string
  oState: "NORMAL"
  createdStamp: number
  updatedStamp: number
  lastRefresh: number
  email?: string
  phone?: string
  workspaces: string[]
}

export interface WorkspaceLocalTable {
  _id: string
  space_id?: string
  infoType: "ME" | "TEAM"
  statusList?: StatusView[]
  tagList?: TagView[]
  oState: OState
  owner: string
  createdStamp: number
  updatedStamp: number
}

export interface MemberLocalTable {
  _id: string
  member_id?: string
  name?: string
  avatar?: {
    file: File
    url?: string
    url0?: string
  }
  workspace: string
  createdStamp: number
  updatedStamp: number
  user: string
  oState: "OK" | "LEFT" | "DELETED"
}

export interface ContentLocalTable {
  _id: string
  content_id?: string
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
  createdStamp: number
  insertedStamp: number
  updatedStamp: number
}


export interface DraftLocalTable {
  _id: string
  draft_id?: string
  infoType: "THREAD" | "COMMENT"
  oState: "OK" | "POSTED" | "DELETED"
  user: string
  workspace: string
  lastSet: number
  threadEdited?: string
  commentEdited?: string
  underThread?: string
  underComment?: string
  replyComment?: string
  visScope?: VisScope
  storageState?: StorageState
  title?: string
  liuDesc?: LiuContent[]
  images?: ImageLocal[]
  files?: FileLocal[]
  whenStamp?: number
  remindMe?: LiuRemindMe
  insertedStamp: number
  updatedStamp: number
}