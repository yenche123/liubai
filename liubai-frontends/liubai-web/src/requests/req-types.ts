// 存放所有接口返回的 data 类型
import type { 
  ContentInfoType,
  LiuContent,
  LiuRemindMe,
  LocalTheme, 
} from "~/types/types-atom"
import type { LocalLocale } from "~/types/types-locale"
import type { 
  UserSubscription, 
  LiuSpaceAndMember, 
  SubscriptionStripe,
  SubscriptionPaymentCircle,
  CloudStorageService,
  Cloud_ImageStore,
  Cloud_FileStore,
} from "~/types/types-cloud"
import { OState, OState_2, OState_3, OState_Draft, SpaceType, StorageState, VisScope } from "~/types/types-basic"
import { EmojiData } from "~/types/types-content"
import { ContentConfig } from "~/types/other/types-custom"


/********************** Hello World *******************/
export interface Res_HelloWorld {
  stamp: number
}


/************************ 登录相关 ********************/

export interface Res_UserLoginInit {
  publicKey?: string
  githubOAuthClientId?: string
  googleOAuthClientId?: string
  state?: string
}

export interface Res_ULN_User extends LiuSpaceAndMember {
  userId: string
  createdStamp: number
}

export interface Res_UserLoginNormal {

  // 需要验证 email 时或只有一个 user 符合时
  email?: string

  // 只有一个 user 符合时
  github_id?: number
  theme?: LocalTheme
  language?: LocalLocale
  // 返回的 space 和 member 信息都是当前用户有加入的，已退出的不会返回
  spaceMemberList?: LiuSpaceAndMember[]
  subscription?: UserSubscription
  serial_id?: string
  token?: string
  userId?: string

  // 有多个 user 符合时
  multi_users?: Res_ULN_User[]
  multi_credential?: string
  multi_credential_id?: string
}

/************************ 用户信息 (包含会员信息) ********************/

export interface Res_UserSettings_Enter {
  email?: string
  github_id?: number
  theme: LocalTheme
  language: LocalLocale
  spaceMemberList: LiuSpaceAndMember[]
  subscription?: UserSubscription
  new_serial?: string
  new_token?: string
}

export type Res_UserSettings_Latest = 
  Omit<Res_UserSettings_Enter, "new_serial" | "new_token">

export interface Res_UserSettings_Membership {
  subscription?: UserSubscription
}

export interface Res_SubPlan_Info {
  id: string
  payment_circle: SubscriptionPaymentCircle
  badge: string
  title: string
  desc: string
  stripe?: SubscriptionStripe

  // 以下价格是向用户在前端展示的价格，请使用用户能理解的常用单位
  // 而非最终收费的单位
  price: string
  currency: string   // 三位英文大写字符组成
  symbol: string     // 货币符号，比如 "¥"
}

export interface Res_SubPlan_StripeCheckout {
  checkout_url: string
}

export interface Res_FileSet_UploadToken {
  cloudService: CloudStorageService
  uploadToken: string
  prefix: string
}

export interface Res_WebhookQiniu {
  cloud_url: string
}


/************** Sync System: upload data *****************/


// an atom which is returned by `sync-set` cloud function
export interface SyncSetAtomRes {
  code: string
  taskId: string
  errMsg?: string
  first_id?: string  // the first id of either content or draft
  new_id?: string    // the new id of either content or draft
}

/** Res_SyncSet on client end */
export interface Res_SyncSet_Client {
  results: SyncSetAtomRes[]
}

/************** Sync System: download data *****************/


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