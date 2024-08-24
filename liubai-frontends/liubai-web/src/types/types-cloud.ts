import type { LiuExif } from "./index"
import type { 
  BaseIsOn, 
  OState_3, 
  SpaceType, 
  OState,
} from "./types-basic"
import type { LiuStateConfig, TagView } from "./types-atom"
import type { 
  MemberConfig, 
  MemberNotification, 
  WorkspaceConfig,
} from "./other/types-custom"

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
  size?: number              // 单位为 bytes
}


/** 登录时，后端传回来的用户基础信息
 * 只有基础的，复杂的数据配置，需要另外调用
*/
export interface LiuSpaceAndMember {
  // 关于 member 的信息
  memberId: string
  member_name?: string
  member_avatar?: Cloud_ImageStore
  member_oState: OState_3
  member_config?: MemberConfig
  member_notification?: MemberNotification

  // 关于 workspace 的信息
  spaceId: string
  spaceType: SpaceType
  space_oState: OState
  space_owner: string
  space_name?: string
  space_avatar?: Cloud_ImageStore
  space_stateConfig?: LiuStateConfig
  space_tagList?: TagView[]
  space_config?: WorkspaceConfig
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

