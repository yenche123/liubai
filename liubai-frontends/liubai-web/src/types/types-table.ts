// 接口名称后缀为 LocalTable 的，代表是本地的数据表
import type { 
  OState, 
  OState_2,
  VisScope, 
  StorageState, 
  OState_3, 
  SpaceType,
  OState_Draft,
} from "./types-basic"
import type { 
  LiuContent, 
  LiuRemindMe, 
  TagView, 
  LiuStateConfig,
  CollectionInfoType,
  ContentInfoType,
  LiuTable,
  LiuUploadTask,
  UploadTaskProgressType,
} from "./types-atom"
import type { LiuFileStore, LiuImageStore } from "./index"
import type { TipTapJSONContent } from "./types-editor"
import type { EmojiData } from "./types-content"
import type { 
  ContentConfig, MemberConfig, WorkspaceConfig
} from "./other/types-custom"
import type { UserSubscription } from "./types-cloud"

export interface BaseLocalTable {
  _id: string
  insertedStamp: number
  updatedStamp: number
}

export interface UserLocalTable extends BaseLocalTable {
  lastRefresh: number
  email?: string
  github_id?: number
  phone?: string
  subscription?: UserSubscription
}

export interface WorkspaceLocalTable extends BaseLocalTable {
  infoType: "ME" | "TEAM"
  stateConfig?: LiuStateConfig
  tagList?: TagView[]
  oState: OState
  owner: string
  name?: string
  avatar?: LiuImageStore
  config?: WorkspaceConfig
}

export interface MemberLocalTable extends BaseLocalTable {
  name?: string
  avatar?: LiuImageStore
  spaceId: string
  user: string
  oState: OState_3
  config?: MemberConfig
}

export interface ContentLocalTable extends BaseLocalTable {
  first_id: string

  /** 以下 4 个属性，若赋值后，不得修改 */
  user: string
  member?: string
  spaceId: string
  spaceType: SpaceType

  infoType: ContentInfoType
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
  removedStamp?: number     // 动态被移至 TRASH 的时间戳

  tagIds?: string[]         // 用于显示的 tagId
  tagSearched?: string[]      // 用于搜索的 tagId 要把 tagIds 的 parent id 都涵盖进来
  stateId?: string
  config?: ContentConfig
  search_title?: string
  search_other?: string

  levelOne?: number         // 一级评论数
  levelOneAndTwo?: number   // 一级 + 二级评论数

  firstSyncStamp?: number   // the stamp when the content is first synced
}

export interface DraftLocalTable extends BaseLocalTable {
  first_id: string
  infoType: ContentInfoType
  oState: OState_Draft
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
  firstSyncStamp?: number   // the stamp when the content is first synced
}

export interface CollectionLocalTable extends BaseLocalTable {
  first_id: string
  oState: OState_2
  user: string
  member?: string
  infoType: CollectionInfoType
  forType: ContentInfoType
  spaceId: string
  spaceType: SpaceType
  content_id: string
  emoji?: string        // 经 encodeURIComponent() 的表情
  operateStamp: number
  sortStamp: number
  firstSyncStamp?: number   // the stamp when the content is first synced
                           // set it after the sync process is done and
                           // you get new_id
}


/** 本地下载任务表 */
export interface DownloadTaskLocalTable {
  _id: string
  insertedStamp: number
  target_id: string
  target_table: LiuTable
  tryTimes?: number           // 下载失败的次数，若大于某个阈值，就放弃
  failedStamp?: number        // 最近一次下载失败的时间戳
}

/** 本地上传任务表 */
export interface UploadTaskLocalTable extends BaseLocalTable {
  user: string
  uploadTask: LiuUploadTask
  content_id?: string
  workspace_id?: string
  member_id?: string
  draft_id?: string
  collection_id?: string
  tryTimes?: number           // 上传失败的次数，若大于某个阈值，就放弃
  failedStamp?: number        // 最近一次上传失败的时间戳
  progressType: UploadTaskProgressType
}