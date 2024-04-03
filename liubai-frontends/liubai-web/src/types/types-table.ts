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
  LiuUploadTask,
} from "./types-atom"
import type { LiuFileStore, LiuImageStore } from "./index"
import type { TipTapJSONContent } from "./types-editor"
import type { EmojiData } from "./types-content"
import type { ContentConfig, MemberConfig } from "./other/types-custom"
import type { UserSubscription } from "./types-cloud"

export interface BaseLocalTable {
  _id: string
  insertedStamp: number
  updatedStamp: number
}

/** 为什么 User 表需要 name 和头像？ 
 *   User 表的 name 和头像是用户的主昵称和头像，
 *   之后被创建的 member 都是从 User 表中授权过去的关系
*/
export interface UserLocalTable extends BaseLocalTable {
  oState: "NORMAL"
  lastRefresh: number
  email?: string
  github_id?: number
  phone?: string

  name?: string             // 存储其他非工作区成员时，需要用到（因为可能出现
  avatar?: LiuImageStore    // 用户不在当前工作区内，没有 memberId，所以就要用 userId 来检索
                            // 该成员的信息，比如昵称和头像
  subscription?: UserSubscription
}

export interface WorkspaceLocalTable extends BaseLocalTable {
  first_id: string
  infoType: "ME" | "TEAM"
  stateConfig?: LiuStateConfig
  tagList?: TagView[]
  oState: OState
  owner: string
  name?: string
  avatar?: LiuImageStore
}

export interface MemberLocalTable extends BaseLocalTable {
  first_id: string
  name?: string
  avatar?: LiuImageStore
  spaceId: string
  user: string
  oState: MemberState
  config?: MemberConfig
}

export interface ContentLocalTable extends BaseLocalTable {
  first_id: string

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
  first_id: string
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
  first_id: string
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
  newBool?: boolean     // 一些开关值，表示最新状态是 true 还是 false
  newStr?: string       // 若 uploadTask 为 emoji 时，此值为 encodeURIComponent() 的表情
                        // 若为取消 emoji，此字段为空字符串
  tryTimes?: number           // 上传失败的次数，若大于某个阈值，就放弃
  failedStamp?: number        // 最近一次上传失败的时间戳
  progressType: "waiting" | "file_uploading" | "sync"
}