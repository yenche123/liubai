// 接口名称后缀为 LocalTable 的，代表是本地的数据表
import type { 
  OState, 
  OState_2,
  VisScope, 
  StorageState, 
  MemberState, 
  SpaceType,
} from "./types-basic"
import type { 
  LiuContent, 
  LiuRemindMe, 
  TagView, 
  LiuStateConfig,
  LiuInfoType,
  LiuTable,
} from "./types-atom"
import type { LiuFileStore, LiuImageStore } from "./index"
import type { TipTapJSONContent } from "./types-editor"
import type { EmojiData } from "./types-content"
import type { ContentConfig, MemberConfig } from "./other/types-custom"

export interface BaseLocalTable {
  _id: string
  insertedStamp: number
  updatedStamp: number
}

export interface UserLocalTable extends BaseLocalTable {
  oState: "NORMAL"
  lastRefresh: number
  email?: string
  phone?: string

  name?: string
  avatar?: LiuImageStore
}

export interface WorkspaceLocalTable extends BaseLocalTable {
  infoType: "ME" | "TEAM"
  stateConfig?: LiuStateConfig
  tagList?: TagView[]
  oState: OState
  owner: string
  name?: string
  avatar?: LiuImageStore
}

export interface MemberLocalTable extends BaseLocalTable {
  name?: string
  avatar?: LiuImageStore
  spaceId: string
  user: string
  oState: MemberState
  config?: MemberConfig
}

export interface ContentLocalTable extends BaseLocalTable {
  cloud_id?: string

  /** 以下 4 个属性，若赋值后，不得修改 */
  user: string
  member?: string
  spaceId: string
  spaceType: SpaceType

  infoType: LiuInfoType
  oState: OState
  visScope: VisScope
  storageState: StorageState
  title?: string
  liuDesc?: LiuContent[]
  images?: LiuImageStore[]
  files?: LiuFileStore[]
  calendarStamp?: number
  remindStamp?: number
  whenStamp?: number
  remindMe?: LiuRemindMe
  emojiData: EmojiData
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  pinStamp?: number         // 被置顶时的时间戳，被取消置顶时为 0
  createdStamp: number      // 动态被创建的时间戳
  editedStamp: number       // 动态被编辑的时间戳
  tagIds?: string[]         // 用于显示的 tagId
  tagSearched?: string[]      // 用于搜索的 tagId 要把 tagIds 的 parent id 都涵盖进来
  stateId?: string
  config?: ContentConfig
  search_title?: string
  search_other?: string
  levelOne?: number         // 一级评论数
  levelOneAndTwo?: number   // 一级 + 二级评论数
}

export interface DraftLocalTable extends BaseLocalTable {
  cloud_id?: string
  infoType: LiuInfoType
  oState: "OK" | "POSTED" | "DELETED"
  user: string
  spaceId: string
  spaceType: SpaceType
  threadEdited?: string
  commentEdited?: string
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  visScope?: VisScope
  storageState?: StorageState
  title?: string
  liuDesc?: TipTapJSONContent[]
  images?: LiuImageStore[]
  files?: LiuFileStore[]
  whenStamp?: number
  remindMe?: LiuRemindMe
  tagIds?: string[]
  editedStamp: number       // 草稿被用户实际编辑的时间戳
  config?: ContentConfig
}

export interface CollectionLocalTable extends BaseLocalTable {
  cloud_id?: string
  oState: OState_2
  user: string
  member?: string
  infoType: "EXPRESS" | "FAVORITE"
  forType: LiuInfoType
  spaceId: string
  spaceType: SpaceType
  content_id: string
  emoji?: string        // 经 encodeURIComponent() 的表情
}


/** 本地下载任务表 */
export interface DowloadTaskLocalTable {
  _id: string
  insertedStamp: number
  target_id: string
  target_table: LiuTable
}