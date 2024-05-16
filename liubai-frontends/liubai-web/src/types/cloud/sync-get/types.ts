import type { SortWay } from "../../types-basic"
import type { 
  CollectionInfoType,
  ContentInfoType,
  LiuContent,
  LiuRemindMe,
} from "../../types-atom"
import type { ThreadListViewType } from "~/types/types-view"
import { 
  OState, 
  OState_2, 
  OState_3, 
  OState_Draft, 
  SpaceType, 
  StorageState, 
  VisScope,
} from "~/types/types-basic"
import type { EmojiData } from "~/types/types-content"
import type { ContentConfig } from "~/types/other/types-custom"
import type { 
  Cloud_ImageStore,
  Cloud_FileStore,
} from "~/types/types-cloud"


/********************* Request types **********************/

interface SyncGet_Base {
  taskId: string
}

export interface SyncGet_ThreadList {
  operateType: "thread_list"
  spaceId: string
  viewType: ThreadListViewType

  // 每次最多加载多少个，默认为 cfg.default_limit.num
  //（该值是计算过，在 1980px 的大屏上也可以触发触底加载的）
  limit?: number

  // 加载收藏
  collectType?: CollectionInfoType

  // 加载某个 emoji
  emojiSpecific?: string

  // 默认为降序，desc
  sort?: SortWay

  // 已加载出来的最后一个 id 的 createdStamp 或 updatedStamp 或 myFavoriteStamp 或 myEmojiStamp
  // 根据 collectType 和 oState 的不同，用不同 item 的属性
  lastItemStamp?: number

  // 加载特定的动态
  specific_ids?: string[]

  // 排除某些动态
  excluded_ids?: string[]

  // 加载特定状态的动态
  stateId?: string
}

export interface SyncGet_ThreadData {
  operateType: "thread_data"
  id: string
}

export interface SyncGet_CommentList_A {
  operateType: "comment_list"
  loadType: "under_thread"
  targetThread: string
  lastItemStamp?: number
}

export interface SyncGet_CommentList_B {
  operateType: "comment_list"
  loadType: "find_children"
  commentId: string
  lastItemStamp?: number
}

export interface SyncGet_CommentList_C {
  operateType: "comment_list"
  loadType: "find_parent"
  parentWeWant: string
  grandparent?: string
}

export interface SyncGet_CommentList_D {
  operateType: "comment_list"
  loadType: "find_hottest"
  commentId: string
}

export type SyncGet_CommentList = SyncGet_CommentList_A | 
  SyncGet_CommentList_B | SyncGet_CommentList_C | SyncGet_CommentList_D

export interface SyncSet_CommentData {
  operateType: "comment_data"
  id: string
}

export interface SyncGet_CheckContents {
  operateType: "check_contents"
  ids: string[]
}

export interface SyncGet_Draft {
  operateType: "draft_data"
  id: string
}

export type CloudMergerOpt = SyncGet_ThreadList | SyncGet_ThreadData |
SyncGet_CommentList | SyncGet_CheckContents

export type SyncGetAtom = CloudMergerOpt & SyncGet_Base


/********************* Response types **********************/

export type LiuDownloadStatus = "has_data" | "not_found"


export interface LiuDownloadCollection {
  _id: string
  first_id: string
  user: string
  member?: string
  oState: OState_2
  operateStamp?: number
  emoji?: string   // the emoji through encodeURIComponent()
}

export interface LiuDownloadAuthor {
  user_id: string
  user_name?: string
  user_avatar?: Cloud_ImageStore
  member_id?: string
  member_name?: string
  member_avatar?: Cloud_ImageStore
  member_oState?: OState_3
}

export interface LiuDownloadContent {
  _id: string
  first_id: string

  isMine: boolean
  author: LiuDownloadAuthor
  spaceId: string
  spaceType: SpaceType

  infoType: ContentInfoType
  oState: OState
  visScope: VisScope
  storageState: StorageState

  title?: string
  liuDesc?: LiuContent[]
  images?: Cloud_ImageStore[]
  files?: Cloud_FileStore[]

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

  levelOne?: number         // 一级评论数
  levelOneAndTwo?: number   // 一级 + 二级评论数

  myFavorite?: LiuDownloadCollection
  myEmoji?: LiuDownloadCollection
}

export interface LiuDownloadDraft {
  _id: string
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

  title?: string
  liuDesc?: LiuContent[]
  images?: Cloud_ImageStore[]
  files?: Cloud_FileStore[]

  whenStamp?: number
  remindMe?: LiuRemindMe
  tagIds?: string[]
  editedStamp: number
}

interface LDP_Base {
  id: string
  status: LiuDownloadStatus
}

export interface LiuDownloadParcel_A extends LDP_Base {
  parcelType: "content"
  content?: LiuDownloadContent
}

export interface LiuDownloadParcel_B extends LDP_Base {
  parcelType: "draft"
  draft?: LiuDownloadDraft
}

export type LiuDownloadParcel = LiuDownloadParcel_A | LiuDownloadParcel_B

export interface SyncGetAtomRes {
  code: string
  taskId: string
  errMsg?: string
  list?: LiuDownloadParcel[]
}

export interface Res_SyncGet_Client {
  results: SyncGetAtomRes[]
}