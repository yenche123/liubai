// 全局类型
// Table_ 开头，表示为数据表结构
// Shared_ 开头，表示为全局缓存 cloud.shared 所涉及的结构
import Stripe from "stripe"

export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}


/*********************** 一些工具类型 **********************/
/**
 * 把类型 T 中 特定的属性 K们 设置为可选的
 */
export type PartialSth<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 把类型 T 中 特定的属性 K们 设置为必选的
 */
export type RequireSth<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/** 在 mongodb 的 findOne 查询中，把一个 Table 类型的 _id 属性去除掉，
 * 并且把其他所有属性设置为 partial
 */
export type MongoFilter<T> = Partial<Omit<T, "_id">>

/** 在 mongodb 中，定义一个 _id 为可选属性的 Table (Collection) */
export type Partial_Id<T extends BaseTable> = PartialSth<T, "_id">

/*********************** 回调类型 **********************/
export interface LiuRqReturn<T = Record<string, any>> {
  code: string
  errMsg?: string
  showMsg?: string
  data?: T
}


/*********************** 基类型、原子化类型 **********************/

export type BaseIsOn = "Y" | "N"

export type OState = "OK" | "REMOVED" | "DELETED"
// 表态、收藏 的 oState
export type OState_2 = "OK" | "CANCELED"
// member 的 oState
export type OState_3 = "OK" | "LEFT" | "DEACTIVATED" | "DELETED"
// user 的 oState
export type OState_User = "NORMAL" | "DEACTIVATED" | "LOCK" | "REMOVED" | "DELETED"

export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system" | "auto"   // auto 就是日夜切换

export const supportedClients = [
  "web",
  "desktop",
] as const
export type SupportedClient = typeof supportedClients[number]

// 各个客户端的最大 token 数
export const clientMaximum: Record<SupportedClient, number> = {
  "web": 9,
  "desktop": 3,
}

export const supportedLocales = [
  "en",
  "zh-Hans",
  "zh-Hant"
] as const

export type SupportedLocale = typeof supportedLocales[number]
export type LocalLocale = SupportedLocale | "system"

interface BaseTable {
  _id: string
  insertedStamp: number
  updatedStamp: number
}

/** 表示 “状态” 的原子结构 */
interface LiuAtomState {
  id: string
  text?: string
  color?: string     // 存储 # 开头的 hex，或者 --liu-state- 开头的系统颜色
  showInIndex: boolean
  contentIds: string[]
  showFireworks?: boolean
  updatedStamp: number
  insertedStamp: number
}

/** 表示数据表里，存储 “状态” 的结构  */
interface Cloud_StateConfig {
  stateList?: LiuAtomState[]
  updatedStamp: number
}

export type SpaceType = "ME" | "TEAM"
export type LiuInfoType = "THREAD" | "COMMENT"
export type VisScope = "DEFAULT" | "PUBLIC" | "LOGIN_REQUIRED"
export type Cloud_StorageState = "CLOUD" | "ONLY_LOCAL"

/** 表示 “标签” 的原子结构 */
interface TagView {
  tagId: string
  text: string
  icon?: string
  oState: "OK" | "REMOVED"
  createdStamp: number
  updatedStamp: number
  children?: TagView[]
}

/** Content 表对象的配置结构 */
export interface ContentConfig {
  showCountdown?: boolean
  allowComment?: boolean
}

/** Member 表对象的配置结构 */
export interface MemberConfig {
  searchKeywords: string[]
  searchTagIds?: string[]
}

/** 附着在 content 上的 emoji 表态信息 */
export interface EmojiSystem {
  num: number
  encodeStr: string
}

export interface EmojiData {
  total: number
  system: EmojiSystem[]
}

/*********************** 编辑器相关 **********************/
// “提醒我” 有哪些合法值
export type LiuRemindLater = "30min" | "1hr" | "2hr" | "3hr" | "tomorrow_this_moment"

// "提醒我" 的结构
export interface LiuRemindMe {
  type: "early" | "later" | "specific_time"

  // 提前多少分钟，若提前一天则为 1440
  early_minute?: number   

  // 30分钟后、1小时候、2小时后、3小时后、明天此刻
  later?: LiuRemindLater

  // 具体时间的时间戳
  specific_stamp?: number
}

export const liuNodeTypes = [
  "heading",          // 标题（只有 h1）
  "paragraph",        // 段落
  "bulletList",       // 无序列表
  "orderedList",      // 有序列表
  "listItem",         // 列表里的单元
  "taskList",         // 任务列表
  "taskItem",         // 任务单元
  "blockquote",       // 引言
  "codeBlock",        // 代码块
  "text",             // 纯文本
  "horizontalRule",   // 分割线
] as const

// 目前支持的内容格式; array[number] 的写法来自
// https://segmentfault.com/q/1010000037769845
export type LiuNodeType = typeof liuNodeTypes[number]

export const isLiuNodeType = (val: string): val is LiuNodeType => {
  return liuNodeTypes.includes(val as LiuNodeType)
}

export const liuMarkTypes = [
  "bold",     // 粗体
  "strike",   // 删除线
  "italic",   // 斜体
  "code",     // 行内代码
  "link",     // 链接
] as const

export type LiuMarkType = typeof liuMarkTypes[number]

export const isLiuMarkType = (val: string): val is LiuMarkType => {
  return liuMarkTypes.includes(val as LiuMarkType)
}

export interface LiuLinkMark {
  type: "link"
  attrs: {
    href: string
    target?: string
    class?: null
  }
}

export interface LiuOtherMark {
  type: Exclude<LiuMarkType, "link">
  attrs?: Record<string, any>
}

export type LiuMarkAtom = LiuLinkMark | LiuOtherMark

export interface LiuContent {
  type: LiuNodeType
  content?: LiuContent[]

  marks?: LiuMarkAtom[]

  // 一些附件信息
  // 比如 有序列表的 start: number 就会放在这里，表示起始的序号
  // 再比如 codeBlock 里的 language: string | null 也会放在这里，表示代码块的语言
  attrs?: Record<string, any>

  text?: string
}

/*********************** 文件图片相关 **********************/

export interface Cloud_FileStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  suffix: string             // 后缀的英文
  size: number               // 单位为 bytes
  mimeType: string
  url: string
}

/** 图像的 exif 信息 */
export interface LiuExif {
  gps?: {
    latitude?: string
    longitude?: string
    altitude?: string
  }
  DateTimeOriginal?: string    // 原始拍摄时间，形如 "YYYY:MM:DD hh:mm:ss"
  HostComputer?: string     // 宿主设备，如果图片经过软件再编辑，此值可能缺省
  Model?: string            // 拍摄时的设备，即使图片经过软件再编辑，此值仍可能存在
}

/** 图片于云端数据库内的存储结构 */
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


/*********************** 杂七杂八的 **********************/
// 新增类型前，记得全局搜索一下，避免冲突

// User 表里的 thirdData 字段的类型
export interface UserThirdData {
  google?: any
  github?: any
}

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

export interface LiuSpaceAndMember {
  // 关于 member 的信息
  memberId: string
  member_name?: string
  member_avatar?: Cloud_ImageStore
  member_oState: OState_3

  // 关于 workspace 的信息
  spaceId: string
  spaceType: SpaceType
  space_oState: OState
  space_owner: string
  space_name?: string
  space_avatar?: Cloud_ImageStore
}

export interface ServiceSendEmailsParam {
  to: string[]        // 目标邮箱地址们
  subject: string     // 标题
  html?: string       // html 格式的内文
  text?: string       // 纯文本 格式的内文
  tags?: {
    name: string
    value: string
  }[]
}

export interface SubscriptionStripe {
  isOn: BaseIsOn
  price_id: string
}

export type SubscriptionPaymentCircle = "monthly" | "yearly"

export interface CredentialMetaData {
  payment_circle?: SubscriptionPaymentCircle
  payment_timezone?: string
  plan?: string
}

/*********************** 数据表类型 **********************/

/** Token表 */
export interface Table_Token extends BaseTable {
  token: string
  expireStamp: number
  userId: string
  isOn: BaseIsOn
  platform: SupportedClient
  client_key?: string
  lastRead: number
  lastSet: number
  ip?: string
  ipGeo?: string
}

/** User表 */
export interface Table_User extends BaseTable {
  oState: OState_User
  email?: string
  phone?: string
  github_id?: number
  thirdData?: UserThirdData
  theme: LocalTheme
  systemTheme?: SupportedTheme
  language: LocalLocale
  systemLanguage?: string
  lastEnterStamp?: number
  subscription?: UserSubscription
  stripe_subscription_id?: string      // stripe 的 Subscription id
  stripe_customer_id?: string          // Customer id on Stripe
  ipArea?: string
}

/** Workspace 表 */
export interface Table_Workspace extends BaseTable {
  infoType: SpaceType
  stateConfig?: Cloud_StateConfig
  tagList?: TagView[]
  oState: OState
  owner: string
  name?: string
  avatar?: Cloud_ImageStore
}

/** Member 表 */
export interface Table_Member extends BaseTable {
  name?: string
  avatar?: Cloud_ImageStore
  spaceId: string
  user: string
  oState: OState_3
  config?: MemberConfig
}


/** 屏蔽表: 目前用于屏蔽特定 ip */
export interface Table_BlockList extends BaseTable {
  type: "ip"
  isOn: BaseIsOn
  value: string
}

/** 内容表: 动态 + 评论 */
export interface Table_Content extends BaseTable {
  first_id: string
  user: string
  member?: string
  spaceId: string
  spaceType: SpaceType

  infoType: LiuInfoType
  oState: OState
  visScope: VisScope
  storageState: Cloud_StorageState

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
}

/** 草稿表 */
export interface Table_Draft extends BaseTable {
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
  storageState?: Cloud_StorageState
  title?: string
  liuDesc?: LiuContent[]
  images?: Cloud_ImageStore[]
  files?: Cloud_FileStore[]
  whenStamp?: number
  remindMe?: LiuRemindMe
  tagIds?: string[]
  editedStamp: number       // 草稿被用户实际编辑的时间戳
  config?: ContentConfig
}

/** 表态和收藏表 */
export interface Table_Collection extends BaseTable {
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


export interface Table_Config extends BaseTable {

  // RSA Key Pair in PEM format
  publicKey: string
  privateKey: string

  // AES-GCM Key in base64 format
  aesKey?: string
  // AES-GCM IV in base64 format
  aesIV?: string


}

/** 临时凭证表的类型 */
export type Table_Credential_Type =  "sms-code" | "email-code" | "scan-code"
  | "users-select" | "stripe-checkout-session"

/** 临时凭证表 */
export interface Table_Credential extends BaseTable {
  credential: string
  infoType: Table_Credential_Type
  expireStamp: number

  verifyNum?: number
  user_ids?: string[]
  userId?: string

  email?: string
  send_channel?: string
  email_id?: string

  thirdData?: UserThirdData

  stripeCheckoutSession?: Stripe.Checkout.Session
  meta_data?: CredentialMetaData
}

/** 订阅方案表 */
export interface Table_Subscription extends BaseTable {
  isOn: BaseIsOn
  payment_circle: SubscriptionPaymentCircle
  badge: string
  title: string
  desc: string
  stripe?: SubscriptionStripe

  // 以下价格是向用户在前端展示的价格，请使用用户能理解的常用单位
  // 而非最终收费的单位
  price_AUD?: string        // 比如 "$9.5"
  price_CNY?: string        // 比如 "￥5"
  price_USD?: string        // 比如 "$5.75"
  price_EUR?: string        // 比如 "€5.50"
  price_HKD?: string        // 比如 "$4.00"
  price_JPY?: string        // 比如 "¥550"
  price_NZD?: string        // 比如 "$5.75"
  price_TWD?: string        // 比如 "150"
}

/** 订单表 */
export interface Table_Order extends BaseTable {
  order_id: string
  user_id: string
  oState: "OK" | "DEL_BY_USER"
  orderStatus: "INIT" | "PAID" | "PAYING" | "CLOSED"
  orderAmount: number      // 订单总金额，以 “分” 为单位
  paidAmount: number       // 已支付的总金额，以 “分” 为单位
  refundedAmount: number
  currency: string         // 小写的货币代码
  payChannel: "stripe" | "wechat" | "alipay"
  orderType: "subscription" | "product"
  plan_id?: string
  product_id?: string
  expireStamp?: number
  tradedStamp?: number

  // 一些 stripe 的信息
  stripe_subscription_id?: string
  stripe_invoice_id?: string
  stripe_charge_id?: string
  stripe_payment_intent_id?: string
  stripe_other_data?: {
    hosted_invoice_url?: string   // 发票地址
    receipt_url?: string          // 收据地址
  }

}


/*********************** 基于 Table 的扩展类型 ***********************/

export interface LiuUserInfo {
  user: Table_User
  spaceMemberList: LiuSpaceAndMember[]
}


/** 聚合搜素 member 表后的 data 结构 */
export interface MemberAggSpaces extends Table_Member {
  spaceList?: Table_Workspace[]
}


/*********************** 一些回调信息 ***********************/

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
  checkout_url: string   // stripe 托管的结账地址
}


/** 一些函数间的入参和出参类型 */

export interface VerifyTokenOpt {
  entering?: boolean         // 当前调用是否为 `user-login` 的 enter
  isRead?: boolean           // 当前调用为读取操作
  isSet?: boolean            // 当前调用为写入操作
}

export interface VerifyTokenRes {
  pass: boolean
  rqReturn?: LiuRqReturn            // 若不通过时的回调
  
  tokenData?: Table_Token
  userData?: Table_User
  workspaces?: string[]

  new_token?: string         // 新的 token
  new_serial?: string        // 新的 serial
}


/*********************** 缓存类型 **********************/

export interface Shared_RSA_Key_Pair {
  publicKey: string
  privateKey: string
}

export interface Shared_ARS_Key_IV {
  aesKey: string
  aesIV: string
}

/** 缓存 token 和 user 信息 */
export interface Shared_TokenUser {
  token: string
  tokenData: Table_Token
  userData: Table_User
  workspaces: string[]
  lastSet: number
}

/** 访问控制每一个 ip */
export interface Shared_AccessControl {
  lastVisitStamp: number
  lastLifeCircleStamp: number
  visitNum: number
  recentVisitStamps: number[]
}

/** 登录接口的访问控制之一 */
export interface Shared_LoginState {
  createdStamp: number
  num: number
}
