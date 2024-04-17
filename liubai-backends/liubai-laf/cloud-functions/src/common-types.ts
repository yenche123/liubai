// 全局类型
// Table_ 开头，表示为数据表结构
// Shared_ 开头，表示为全局缓存 cloud.shared 所涉及的结构
import Stripe from "stripe"
import * as vbot from "valibot"
import type { BaseSchema } from "valibot"

// Sch_ 开头的，表示类型的 Schema，用于 valibot
// Res_ 开头的，表示返回至前端的类型
// Param_ 开头的，表示传入云函数的类型

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

// 内容的 oState
export type OState = "OK" | "REMOVED" | "DELETED"
// 表态、收藏 的 oState
export type OState_2 = "OK" | "CANCELED"
// member 的 oState
export type OState_3 = "OK" | "LEFT" | "DEACTIVATED" | "DELETED"
// user 的 oState
export type OState_User = "NORMAL" | "DEACTIVATED" | "LOCK" | "REMOVED" | "DELETED"
// draft 的 oState
export type OState_Draft = "OK" | "POSTED" | "DELETED"


export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system" | "auto"   // auto 就是日夜切换

export const supportedClients = [
  "web",
  "desktop",
] as const
export type SupportedClient = typeof supportedClients[number]
export const Sch_SupportedClient = vbot.picklist(supportedClients)

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
export const Sch_SupportedLocale = vbot.picklist(supportedLocales)
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

export const Sch_ContentConfig = vbot.object({
  showCountdown: vbot.optional(vbot.boolean()),
  allowComment: vbot.optional(vbot.boolean()),
}, vbot.never())

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
export const liuRemindLaters = [
  "30min",
  "1hr",
  "2hr",
  "3hr",
  "tomorrow_this_moment",
] as const
export type LiuRemindLater = typeof liuRemindLaters[number]
export const Sch_LiuRemindLater = vbot.picklist(liuRemindLaters)

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

export const Sch_LiuRemindMe = vbot.object(
  {
    type: vbot.picklist(["early", "later", "specific_time"]),
    early_minute: vbot.optional(vbot.number()),
    later: vbot.optional(Sch_LiuRemindLater),
    specific_stamp: vbot.optional(vbot.number()),
  },
  vbot.never()
)


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
export const Sch_LiuNodeType = vbot.picklist(liuNodeTypes)

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
export const Sch_LiuMarkType = vbot.picklist(liuMarkTypes)
export const isLiuMarkType = (val: string): val is LiuMarkType => {
  return liuMarkTypes.includes(val as LiuMarkType)
}

export interface LiuLinkMark {
  type: "link"
  attrs: {
    href: string
    target?: string
    class?: string
  }
}
export const Sch_LiuLinkMark = vbot.object({
  type: vbot.literal("link"),
  attrs: vbot.object({
    href: vbot.string(),
    target: vbot.optional(vbot.string()),
    class: vbot.optional(vbot.string()),
  })
})

export interface LiuOtherMark {
  type: Exclude<LiuMarkType, "link">
  attrs?: Record<string, any>
}

export const Sch_LiuOtherMark = vbot.object({
  type: vbot.picklist(liuMarkTypes.filter(v => v !== "link")),
  attrs: vbot.optional(vbot.record(vbot.any())),
})

export type LiuMarkAtom = LiuLinkMark | LiuOtherMark
export const Sch_LiuMarkAtom = vbot.union([Sch_LiuLinkMark, Sch_LiuOtherMark])

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

export const Sch_Simple_LiuContent = vbot.object({
  type: Sch_LiuNodeType,
  marks: vbot.optional(vbot.array(Sch_LiuMarkAtom)),
  attrs: vbot.optional(vbot.record(vbot.any())),
  text: vbot.optional(vbot.string()),
})

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

export const Sch_Cloud_FileStore: BaseSchema<Cloud_FileStore> = vbot.object({
  id: vbot.string(),
  name: vbot.string(),
  lastModified: vbot.number(),
  suffix: vbot.string(),
  size: vbot.number(),
  mimeType: vbot.string(),
  url: vbot.string(),
}, vbot.never())

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

export const Sch_LiuExif = vbot.object({
  gps: vbot.optional(vbot.object({
    latitude: vbot.optional(vbot.string()),
    longitude: vbot.optional(vbot.string()),
    altitude: vbot.optional(vbot.string()),
  })),
  DateTimeOriginal: vbot.optional(vbot.string()),
  HostComputer: vbot.optional(vbot.string()),
  Model: vbot.optional(vbot.string()),
})

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

export const Sch_Cloud_ImageStore: BaseSchema<Cloud_ImageStore> = vbot.object(
  {
    id: vbot.string(),
    name: vbot.string(),
    lastModified: vbot.number(),
    mimeType: vbot.optional(vbot.string()),
    width: vbot.optional(vbot.number()),
    height: vbot.optional(vbot.number()),
    h2w: vbot.optional(vbot.string()),
    url: vbot.string(),
    url_2: vbot.optional(vbot.string()),
    blurhash: vbot.optional(vbot.string()),
    someExif: vbot.optional(Sch_LiuExif),
  },
  vbot.never(),
)


/*********************** 杂七杂八的 **********************/
// 新增类型前，记得全局搜索一下，避免冲突

export type CloudStorageService = "qiniu" | "tecent_cos" | "aliyun_oss"

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

/*********************** 加解密相关 **********************/
export interface CryptoCipherAndIV {
  cipherText: string
  iv: string
}

export interface LiuPlainText<T = any> {
  pre: string        // client_key 的前五码
  nonce: string
  data: T
}


/*********************** 关于上传同步 ********************/
/** 
 * 上传（同步）的类型
 */
export const liuUploadTasks = [
  "content-post",             // 发表（不区分动态或评论）
  "thread-edit",              // 编辑动态
  "thread-hourglass",         // 倒计时器
  "undo_thread-hourglass",    // 【撤销】倒计时
  "thread-collect",           // 收藏动态
  "undo_thread-collect",      // 【撤销】收藏
  "content-emoji",            // 对 动态、评论 reaction
  "undo_content-emoji",       // 【撤销】reaction
  "thread-delete",            // 删除动态
  "undo_thread-delete",       // 【撤销】删除动态
  "thread-state",             // 修改动态的状态
  "undo_thread-state",        // 【撤销】修改动态的状态
  "thread-restore",           // 恢复回收桶里的动态
  "thread-delete_forever",    // 彻底删除动态
  "thread-pin",               // 置顶、取消置顶
  "undo_thread-pin",          // 【撤销】是否置顶
  "thread-float_up",          // 浮上去、取消上浮
  "undo_thread-float_up",     // 【撤销】浮上去、取消上浮
  "thread-tag",               // 修改动态的标签
  "comment-delete",           // 删除评论
  "comment-edit",             // 编辑评论
  "workspace-tag",            // 编辑工作空间的标签，这时 target_id 为 workspace id
  "member-avatar",            // 修改当前工作区自己的头像
  "member-nickname",          // 修改当前工作区自己的昵称
  "draft-clear",              // 删除某个 draft_id 的草稿
  "draft-set",                // 设置草稿，注意这时 UploadTaskLocalTable 的 content_id
                              // 必须为空（否则会被当作 content-xxx 的事件处理），而是
                              // 用 draft_id 来查询本地的哪个操作
] as const

export type LiuUploadTask = typeof liuUploadTasks[number]
export const Sch_LiuUploadTask = vbot.picklist(liuUploadTasks)

/** 设置 “动态、评论和草稿” 都有的字段 */
export interface LiuUploadBase {
  id?: string          // 如果是已上传过的内容，必须有此值，这是后端的 _id
  first_id?: string    // 发表时，必填
  spaceId?: string     // 发表时，必填，表示存到哪个工作区

  storageState?: Cloud_StorageState

  liuDesc?: LiuContent[]
  images?: Cloud_ImageStore[]
  files?: Cloud_FileStore[]

  editedStamp?: number
}

/** 存一些 动态 与评论和草稿相比独有的字段 */
export interface LiuUploadThread extends LiuUploadBase {

  // oState 的操作，在 taskType 上就定义了

  title?: string
  calendarStamp?: number
  remindStamp?: number
  whenStamp?: number
  remindMe?: LiuRemindMe
  pinStamp?: number
  createdStamp?: number
  tagIds?: string[]
  tagSearched?: string[]
  stateId?: string
  config?: ContentConfig
}

/** 存一些 评论 与动态和草稿相比独有的字段 */
export interface LiuUploadComment extends LiuUploadBase {
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  createdStamp?: number
}

/** 存一些 草稿 与评论和动态相比独有的字段 */
export interface LiuUploadDraft extends LiuUploadBase {
  infoType?: LiuInfoType      // 新建 draft 时，必填
  
  threadEdited?: string
  commentEdited?: string
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  
  title?: string
  whenStamp?: number
  remindMe?: LiuRemindMe
  tagIds?: string[]
  config?: ContentConfig
}

export interface LiuUploadMember {
  id: string
  operateStamp: number     // 操作的时间戳
  name?: string
  avatar?: Cloud_ImageStore
}

export interface LiuUploadWorkspace {
  id: string
  operateStamp: number     // 操作的时间戳
  name?: string
  avatar?: Cloud_ImageStore
  stateConfig?: Cloud_StateConfig
  tagList?: TagView[]
}

export interface SyncSetAtom {
  taskType: LiuUploadTask
  taskId: string

  thread?: LiuUploadThread
  comment?: LiuUploadComment
  draft?: LiuUploadDraft
  member?: LiuUploadMember
  workspace?: LiuUploadWorkspace
}

export const Sch_Simple_SyncSetAtom = vbot.object({
  taskType: Sch_LiuUploadTask,
  taskId: vbot.string(),
})


// 这个上下文的 map 的结构会是 Map<SyncSetCtxKey, Map<string, SyncSetAtom>>
// 其中 string 为数据表某一行数据的 id
export type SyncSetCtxKey = "content" | "draft" | "member" | "workspace"
export interface SyncSetCtxAtom<T> {  // 这里的 T 必须是 Table 类型
  data: T
  updateData?: Partial<T>
}

export interface SyncSetCtx {

  // 下面四个属性，其首字母大写后，要直接对应数据表的表名
  content: Map<string, SyncSetCtxAtom<Table_Content>>
  draft: Map<string, SyncSetCtxAtom<Table_Draft>>
  member: Map<string, SyncSetCtxAtom<Table_Member>>
  workspace: Map<string, SyncSetCtxAtom<Table_Workspace>>

  // my data
  me: Table_User,

  // the list of workspace ids that the user is in
  space_ids: string[],
}

export interface SyncSetAtomRes {
  code: string
  taskId: string
  errMsg?: string
  first_id?: string  // the first id of either content or draft
  new_id?: string    // the new id of either content or draft
}

export interface Res_SyncSet {
  results: SyncSetAtomRes[]
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
  total_size?: number                 // 用户的总存储空间，单位为 kB
  upload_size?: number                // 用户的总历史上传空间，单位为 kB
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
  editedStamp?: number       // 同步时，用来比大小的
}

/** Member 表 */
export interface Table_Member extends BaseTable {
  name?: string
  avatar?: Cloud_ImageStore
  spaceId: string
  user: string
  oState: OState_3
  config?: MemberConfig
  editedStamp?: number      // 同步时，用来比大小的
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

/*********************** 云函数入参信息 ***********************/
// webhook-qiniu 的入参
export interface Param_WebhookQiniu {
  bucket: string
  key: string
  hash: string
  fsize: string
  fname: string
  mimeType: string
  endUser: string
}

export const Sch_Param_WebhookQiniu = vbot.object({
  bucket: vbot.string(),
  key: vbot.string(),
  hash: vbot.string(),
  fsize: vbot.string(),
  fname: vbot.string(),
  mimeType: vbot.string(),
  endUser: vbot.string(),
})


/*********************** 回调信息(云函数出参信息) ***********************/
// Res_ 开头表示回传的数据
// Param_ 开头表示入参数据

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

export interface Res_FileSet_UploadToken {
  cloudService: CloudStorageService
  uploadToken: string
  prefix: string
}

export interface Res_WebhookQiniu {
  cloud_url: string
}


/******************** 一些云函数间内部的入参和出参类型 **********/

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
