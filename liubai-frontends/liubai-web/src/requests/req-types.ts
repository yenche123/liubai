// 存放所有接口返回的 data 类型
import type { 
  LiuUploadTask, 
  LocalTheme, 
} from "~/types/types-atom"
import type { LocalLocale } from "~/types/types-locale"
import type { 
  UserSubscription, 
  LiuSpaceAndMember, 
  SubscriptionStripe,
  SubscriptionPaymentCircle,
  CloudStorageService,
} from "~/types/types-cloud"


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


/************** 同步笔记 *****************/
export interface Param_Note_Sync {
  taskType: LiuUploadTask
  
}