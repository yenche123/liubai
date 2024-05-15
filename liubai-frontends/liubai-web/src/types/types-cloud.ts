import type { LiuExif } from "./index"
import type { 
  BaseIsOn, 
  MemberState, 
  SpaceType, 
  OState,
  SortWay,
} from "./types-basic"
import type { LiuAtomState, CollectionInfoType } from "./types-atom"
import type { ThreadListViewType } from "~/types/types-view"

export interface Cloud_FileStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  suffix: string             // 后缀的英文
  size: number               // 单位为 bytes
  mimeType: string
  url: string
}

export interface Cloud_ImageStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  mimeType?: string
  width?: number
  height?: number
  h2w?: string
  url: string
  url_2?: string             // 低分辨率的图片地址
  blurhash?: string
  someExif?: LiuExif
}

/** 工作区内，存储 “状态” 的结构  */
export interface Cloud_StateConfig {
  stateList?: LiuAtomState[]
  updatedStamp: number
}


/** 登录时，后端传回来的用户基础信息
 * 只有基础的，复杂的数据配置，需要另外调用
*/
export interface LiuSpaceAndMember {
  // 关于 member 的信息
  memberId: string
  member_name?: string
  member_avatar?: Cloud_ImageStore
  member_oState: MemberState

  // 关于 workspace 的信息
  spaceId: string
  spaceType: SpaceType
  space_oState: OState
  space_owner: string
  space_name?: string
  space_avatar?: Cloud_ImageStore
}


/*************************** 加解密 **********************/
export interface LiuPlainText<T = any> {
  pre: string        // client_key 的前五码
  nonce: string
  data: T
}


/*************************** 订阅相关 **********************/

/** 用户的订阅方案 */
export interface UserSubscription {
  isOn: BaseIsOn
  plan: string             // 订阅计划应用内 Subscription 表的 _id
  isLifelong: boolean
  autoRecharge?: boolean   // 是否开启自动续费，当为 undefined 表示不得而知
  createdStamp: number     // 第一次创建订阅的时间戳
  chargedStamp?: number    // 最近一次付费的时间戳，不排除免费开启订阅，所以此项选填
  firstChargedStamp?: number    // 第一次付费的时间戳，用于判断是否支持退款
  expireStamp?: number
  chargeTimes?: number    // 被索取费用的次数
  stripe?: {              // 存储一些有关于 stripe 的信息
    customer_portal_url?: string        // stripe 的订阅管理网址，供用户去管理订阅
    customer_portal_created?: number    // 注意: 以秒为单位
  }
}

export interface SubscriptionStripe {
  isOn: BaseIsOn
  price_id: string
}

export type SubscriptionPaymentCircle = "monthly" | "yearly"

/*************************** 云存储 **********************/
// 云存储服务
export type CloudStorageService = "qiniu" | "tecent_cos" | "aliyun_oss"

/********************** 同步系统: 下载内容 ********************/

export interface SyncGet_Base {
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


export interface SyncGet_CheckIds {
  operateType: "check_ids"
  ids: string[]
}

export type CloudMergerOpt = SyncGet_ThreadList | SyncGet_ThreadData |
SyncGet_CommentList | SyncGet_CheckIds

export type SyncGetAtom = CloudMergerOpt & SyncGet_Base