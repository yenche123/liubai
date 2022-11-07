// 接口名称后缀为 LocalTable 的，代表是本地的数据表
import type { OState } from "./types-basic"
import type { StatusView, TagView } from "./types-atom"


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