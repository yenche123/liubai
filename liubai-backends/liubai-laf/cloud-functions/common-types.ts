// Function Name: common-types
import Stripe from "stripe"
import * as vbot from "valibot"
import type { BaseSchema } from "valibot"

// 全局类型
// Table_ 开头，表示为数据表结构
// Shared_ 开头，表示为全局缓存 cloud.shared 所涉及的结构
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

export type LiuTimeout = ReturnType<typeof setTimeout> | undefined

/*********************** 回调类型 **********************/
export interface LiuRqReturn<T = Record<string, any>> {
  code: string
  errMsg?: string
  showMsg?: string
  data?: T
}

export interface LiuErrReturn {
  code: string
  errMsg?: string
}

/***************** 基础 Schema 用于 valibot *************/
// validate id's min length
export const Sch_Id = vbot.string([vbot.minLength(8)])
export const Sch_Opt_Str = vbot.optional(vbot.string())
export const Sch_Opt_Num = vbot.optional(vbot.number())
export const Sch_Opt_Bool = vbot.optional(vbot.boolean())
export const Sch_Opt_Id = vbot.optional(Sch_Id)

// trim 后有字符串的 string
export const sch_string_length = (minLength: number = 1) => {
  return vbot.string([
    vbot.toTrimmed(), 
    vbot.minLength(minLength)
  ])
}

// trim 后有字符串的 string
export const Sch_String_WithLength = sch_string_length()

// optional array something
export const sch_opt_arr = (
  sch: BaseSchema, 
  pipe?: vbot.Pipe<any>,
) => {
  return vbot.optional(vbot.array(sch, pipe))
}

export const sch_opt_num = (
  min?: number,
  max?: number,
) => {
  let pipe: vbot.Pipe<any> | undefined
  if(min) pipe = [vbot.minValue(min)]
  if(max) {
    const m = vbot.maxValue(max)
    pipe = pipe ? [...pipe, m] : [m]
  }
  return vbot.optional(vbot.number(pipe))
}


/******************** 一些 Node.js 函数的封装类型 *******************/
export interface LiuRqOpt {
  method?: "POST" | "GET"
  headers?: HeadersInit
  timeout?: number           // 超时的毫秒数，默认为 10000; 当 signal 属性存在时，此值无意义
}

export interface DownloadFileOpt {
  max_sec?: number       // max seconds for waiting. default 30
}

export interface DownloadFileRes {
  code: string
  errMsg?: string
  data?: {
    url: string
    res: Response
  }
}

export type DownloadFileResolver = (res: DownloadFileRes) => void

/*********************** 基类型、原子化类型 **********************/

export type BaseIsOn = "Y" | "N"

// 内容的 oState
export type OState = "OK" | "REMOVED" | "DELETED"

// 表态、收藏 的 oState
export const oState_2s = ["OK", "CANCELED"] as const
export type OState_2 = typeof oState_2s[number]
export const Sch_OState_2 = vbot.picklist(oState_2s)

// member 的 oState
export type OState_3 = "OK" | "LEFT" | "DEACTIVATED" | "DELETED"

export const oState_4s = ["OK", "REMOVED"] as const
export type OState_4 = typeof oState_4s[number]
export const Sch_OState_4 = vbot.picklist(oState_4s)

// user 的 oState
export type OState_User = "NORMAL" | "DEACTIVATED" | "LOCK" | "REMOVED" | "DELETED"

// draft 的 oState
export const oState_Drafts = ["OK", "POSTED", "DELETED", "LOCAL"] as const
export type OState_Draft = typeof oState_Drafts[number]
export const Sch_OState_Draft = vbot.picklist(oState_Drafts)

export const supportedThemes = ["light", "dark"] as const
export type SupportedTheme = typeof supportedThemes[number]
export const Sch_SupportedTheme = vbot.picklist(supportedThemes)

export const localThemes = [...supportedThemes, "system", "auto"] as const
export type LocalTheme = typeof localThemes[number]
export const Sch_LocalTheme = vbot.picklist(localThemes)

export const threadListViewTypes = [
  "TRASH", 
  "TAG", 
  "FAVORITE", 
  "PINNED",
  "INDEX",
  "STATE",
  "CALENDAR",
] as const
export type ThreadListViewType = typeof threadListViewTypes[number]
export const Sch_ThreadListViewType = vbot.picklist(threadListViewTypes)

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

export const localLocales = [...supportedLocales, "system"] as const
export type LocalLocale = typeof localLocales[number]
export const Sch_LocalLocale = vbot.picklist(localLocales)

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
  contentIds?: string[]
  showFireworks?: boolean
  updatedStamp: number
  insertedStamp: number
}

const Sch_LiuAtomState: BaseSchema<LiuAtomState> = vbot.object({
  id: Sch_String_WithLength,
  text: Sch_Opt_Str,
  color: Sch_Opt_Str,
  showInIndex: vbot.boolean(),
  contentIds: sch_opt_arr(Sch_Id),
  showFireworks: vbot.optional(vbot.boolean()),
  updatedStamp: vbot.number(),
  insertedStamp: vbot.number()
})

/** 表示数据表里，存储 “状态” 的结构  */
interface LiuStateConfig {
  stateList: LiuAtomState[]
  updatedStamp: number
}

export const Sch_LiuStateConfig: BaseSchema<LiuStateConfig> = vbot.object({
  stateList: vbot.array(Sch_LiuAtomState),
  updatedStamp: vbot.number(),
})

export type SpaceType = "ME" | "TEAM"

export const sortWays = ["desc", "asc"] as const
export type SortWay = typeof sortWays[number]
export const Sch_SortWay = vbot.picklist(sortWays)

export const contentInfoTypes = ["THREAD", "COMMENT"] as const
export type ContentInfoType = typeof contentInfoTypes[number]
export const Sch_ContentInfoType = vbot.picklist(contentInfoTypes)

export const collectionInfoTypes = [
  "EXPRESS",
  "FAVORITE"
] as const
export type CollectionInfoType = typeof collectionInfoTypes[number]
export const Sch_CollectionInfoType = vbot.picklist(collectionInfoTypes)


export type VisScope = "DEFAULT" | "PUBLIC" | "LOGIN_REQUIRED"
export type Cloud_StorageState = "CLOUD" | "ONLY_LOCAL"

/** 表示 “标签” 的原子结构 */
interface TagView {
  tagId: string
  text: string
  icon?: string
  oState: OState_4
  createdStamp: number
  updatedStamp: number
  children?: TagView[]
}

export const Sch_TagView: BaseSchema<TagView> = vbot.object({
  tagId: Sch_Id,
  text: vbot.string(),
  icon: Sch_Opt_Str,
  oState: Sch_OState_4,
  createdStamp: vbot.number(),
  updatedStamp: vbot.number(),
  children: sch_opt_arr(vbot.lazy(() => Sch_TagView)),
})



/** Content 表对象的配置结构 */
export interface ContentConfig {
  showCountdown?: boolean
  allowComment?: boolean
  lastToggleCountdown?: number    // last stamp when user toggle showCountdown
  lastOStateStamp?: number         // last stamp when user edited oState
  lastOperateStateId?: number     // last stamp when user edited stateId
  lastOperatePin?: number        // last stamp when user edited pin
  lastOperateTag?: number        // last stamp when user edited tag
  lastOperateWhenRemind?: number   // last stamp when user 
                                   // edited whenStamp / remindStamp / remind
  lastUpdateEmojiData?: number      // last stamp when emojiData is updated
  lastUpdateLevelNum?: number   // last stamp when levelOne or 
                                // levelOneAndTwo is updated
}

export const Sch_ContentConfig = vbot.object({
  showCountdown: Sch_Opt_Bool,
  allowComment: Sch_Opt_Bool,
  lastToggleCountdown: Sch_Opt_Num,
  lastOStateStamp: Sch_Opt_Num,
  lastOperateStateId: Sch_Opt_Num,
  lastOperatePin: Sch_Opt_Num,
  lastOperateTag: Sch_Opt_Num,
  lastOperateWhenRemind: Sch_Opt_Num,
  lastUpdateEmojiData: Sch_Opt_Num,
  lastUpdateLevelNum: Sch_Opt_Num,
}, vbot.never())

/** The config of Workspace */
export interface WorkspaceConfig {
  // last stamp when user edited tagList of workspace
  lastOperateTag?: number
}

/** The config of Member */
export interface MemberConfig {
  searchKeywords?: string[]
  searchTagIds?: string[]
  lastOperateName?: number     // last stamp when user edited name
}

export interface MemberNotification {
  ww_qynb_toggle?: boolean
  wx_gzh_toggle?: boolean
}

/** 附着在 content 上的 emoji 表态信息 */
export interface EmojiSystem {
  num: number
  encodeStr: string
}

export const Sch_EmojiSystem = vbot.object({
  num: vbot.number(),
  encodeStr: vbot.string(),
}, vbot.never())

export interface EmojiData {
  total: number
  system: EmojiSystem[]
}

export const Sch_EmojiData = vbot.object({
  total: vbot.number(),
  system: vbot.array(Sch_EmojiSystem),
}, vbot.never())

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
    early_minute: Sch_Opt_Num,
    later: vbot.optional(Sch_LiuRemindLater),
    specific_stamp: Sch_Opt_Num,
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
    class?: string | null
  }
}
export const Sch_LiuLinkMark = vbot.object({
  type: vbot.literal("link"),
  attrs: vbot.object({
    href: vbot.string(),
    target: Sch_Opt_Str,
    class: vbot.nullish(vbot.string()),
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

// LiuContent 里头会嵌套 LiuContent[]
// 但为了检测级数，避免嵌套过深，所以 Sch_Simple_LiuContent 不添加 content 字段
// 而是放在 common-util isLiuContentArr() 进行递归检查
export const Sch_Simple_LiuContent = vbot.object({
  type: Sch_LiuNodeType,
  marks: sch_opt_arr(Sch_LiuMarkAtom),
  attrs: vbot.optional(vbot.record(vbot.any())),
  text: Sch_Opt_Str,
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
    latitude: Sch_Opt_Str,
    longitude: Sch_Opt_Str,
    altitude: Sch_Opt_Str,
  })),
  DateTimeOriginal: Sch_Opt_Str,
  HostComputer: Sch_Opt_Str,
  Model: Sch_Opt_Str,
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
    mimeType: Sch_Opt_Str,
    width: Sch_Opt_Num,
    height: Sch_Opt_Num,
    h2w: Sch_Opt_Str,
    url: vbot.string(),
    url_2: Sch_Opt_Str,
    blurhash: Sch_Opt_Str,
    someExif: vbot.optional(Sch_LiuExif),
  },
  vbot.never(),
)


/*********************** 杂七杂八的 **********************/
// 新增类型前，记得全局搜索一下，避免冲突

// 每个请求里皆应存在的参数字段
export const Sch_X_Liu = vbot.object({
  x_liu_language: sch_string_length(2),
  x_liu_theme: Sch_SupportedTheme,
  x_liu_version: sch_string_length(3),     // 比如 "2.0" 最少有三个字符

  // 最小要大于 2024-04-06，这个日期没有意义，只是已读罢了
  x_liu_stamp: vbot.number([vbot.minValue(1712345670000)]),

  x_liu_timezone: sch_string_length(),
  x_liu_client: Sch_SupportedClient,
})

export const Sch_IP = vbot.string([vbot.ip()])

export type CloudStorageService = "qiniu" | "tecent_cos" | "aliyun_oss"

// user's wechat data
export interface UserWeChatGzh {

  // https://developers.weixin.qq.com/doc/offiaccount/User_Management/Get_users_basic_information_UnionID.html#UinonId
  subscribe?: 0 | 1            // 0: unsubscribed    1: subscribed
  language?: string
  subscribe_time?: number      // the time (sec) of the user's subscription
  subscribe_scene?: string

  // https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html#3
  nickname?: string
  headimgurl?: string

}

// User 表里的 thirdData 字段的类型
export interface UserThirdData {
  google?: any
  github?: any
  wecom?: Ww_External_Contact
  wx_gzh?: UserWeChatGzh
}

/** 用户的订阅方案 */
export interface UserSubscription {
  isOn: BaseIsOn
  plan: string             // 订阅计划 “应用内 Subscription 表” 的 _id
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
  memberId?: string
  pic_url?: string
  qr_code?: string
  ww_qynb_config_id?: string
}

/*********************** 加解密相关 **********************/
export interface CryptoCipherAndIV {
  cipherText: string
  iv: string
}

export interface LiuPlainText<T = any> {
  pre: string        // AES key 的前五码
  nonce: string
  data: T
}

/*********************** 通用函数间的返回格式 **********************/

export interface CommonPass_A {
  pass: false
  err: LiuErrReturn
}

export interface CommonPass_B<T> {
  pass: true
  data?: T
}

export type CommonPass<T = any> = CommonPass_A | CommonPass_B<T>


/*********************** 关于上传同步 ********************/
/** 
 * 上传（同步）的类型
 */
export const liuUploadTasks = [
  "thread-post",
  "comment-post",
  "thread-edit",              // 编辑动态
  "thread-only_local",        // 将动态切换为 ONLY_LOCAL
  "thread-hourglass",         // 倒计时器
  "undo_thread-hourglass",    // 【撤销】倒计时
  "thread-when-remind",       // 修改 "什么时候" 和 "提醒我"
  "undo_thread-when-remind",  // 【撤销】修改 "什么时候" 和 "提醒我"
  "collection-favorite",           // 收藏动态
  "undo_collection-favorite",      // 【撤销】收藏
  "collection-react",            // 对 动态、评论 reaction
  "undo_collection-react",       // 【撤销】reaction
  "thread-delete",            // 删除动态
  "undo_thread-delete",       // 【撤销】删除动态
  "thread-state",             // 修改动态的状态
  "undo_thread-state",        // 【撤销】修改动态的状态
  "thread-restore",           // 恢复回收桶里的动态
  "thread-delete_forever",    // 彻底删除动态
  "thread-pin",               // 置顶、取消置顶
  "undo_thread-pin",          // 【撤销】是否置顶
  "thread-tag",               // 修改动态的标签
  "comment-delete",           // 删除评论
  "comment-edit",             // 编辑评论
  "workspace-tag",            // 编辑工作区的标签，这时 target_id 为 workspace id
  "workspace-state_config",   // 编辑工作区的“状态”结构，动态上浮时，也会用到这个事件
  "undo_workspace-state_config",  //【撤销】工作区的状态结构之变更
  "member-avatar",            // 修改当前工作区自己的头像
  "member-nickname",          // 修改当前工作区自己的昵称
  "draft-clear",              // 删除某个 draft_id 的草稿
  "draft-set",                // 设置草稿，注意这时 UploadTaskLocalTable 的 content_id
                              // 必须为空（否则会被当作 content-xxx 的事件处理），而是
                              // 用 draft_id 来查询本地的哪个操作
] as const

export type LiuUploadTask = typeof liuUploadTasks[number]
export const Sch_LiuUploadTask = vbot.picklist(liuUploadTasks)

/** 上传数据的基类型 */
export interface LiuUploadBase {
  id?: string          // 如果是已上传过的内容，必须有此值，这是后端的 _id
  first_id?: string    // 在删除、恢复、彻底删除动态时，此值为 undefined
  spaceId?: string     // 发表时，必填，表示存到哪个工作区

  liuDesc?: LiuContent[]
  images?: Cloud_ImageStore[]
  files?: Cloud_FileStore[]
  
  editedStamp?: number
}

/** 存一些 动态 与评论和草稿相比独有的字段 */
export interface LiuUploadThread extends LiuUploadBase {

  // 仅在 thread-post 时有效且此时必填
  oState?: Exclude<OState, "DELETED">

  title?: string
  calendarStamp?: number
  remindStamp?: number
  whenStamp?: number
  remindMe?: LiuRemindMe
  pinStamp?: number

  createdStamp?: number
  removedStamp?: number

  tagIds?: string[]
  tagSearched?: string[]
  stateId?: string
  
  // 只在 thread-post 时有效，且此时必填
  emojiData?: EmojiData
  config?: ContentConfig

  // 只在 thread-hourglass 时有效，且为必填
  showCountdown?: boolean
}

/** 存一些 评论 与动态和草稿相比独有的字段 */
export interface LiuUploadComment extends LiuUploadBase {
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  createdStamp?: number

  // 只在 comment-post 时有效，且此时必填
  emojiData?: EmojiData
}

/** 存一些 草稿 与评论和动态相比独有的字段 */
export interface LiuUploadDraft extends LiuUploadBase {
  oState?: OState_Draft
  infoType?: ContentInfoType      // 新建 draft 时，必填
  
  threadEdited?: string
  commentEdited?: string
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  
  title?: string
  whenStamp?: number
  remindMe?: LiuRemindMe
  tagIds?: string[]
}

export interface LiuUploadMember {
  id: string
  name?: string
  avatar?: Cloud_ImageStore
}

export interface LiuUploadWorkspace {
  id: string
  name?: string
  avatar?: Cloud_ImageStore
  stateConfig?: LiuStateConfig
  tagList?: TagView[]
}

export interface LiuUploadCollection {
  id?: string          // 如果是已上传必须有此值，这是后端的 _id
  first_id: string
  oState: OState_2
  content_id: string
  emoji?: string
  sortStamp: number
}

export interface SyncSetAtom {
  taskType: LiuUploadTask
  taskId: string

  thread?: LiuUploadThread
  comment?: LiuUploadComment
  draft?: LiuUploadDraft
  member?: LiuUploadMember
  workspace?: LiuUploadWorkspace
  collection?: LiuUploadCollection

  operateStamp: number // 表示这个操作被发起的时间戳，非常重要，用于校时用
}

export const Sch_Simple_SyncSetAtom = vbot.object({
  taskType: Sch_LiuUploadTask,
  taskId: vbot.string(),
  operateStamp: vbot.number(),
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
  collection: Map<string, SyncSetCtxAtom<Table_Collection>>

  // my data
  me: Table_User

  // the list of workspace ids that the user is in
  space_ids: string[]

  // to avoid duplicating updatedStamp or insertedStamp
  lastUsedStamp: number
}

export type SyncSetTable = Table_Content | 
  Table_Draft | Table_Member | Table_Workspace | Table_Collection

export interface SyncSetAtomRes {
  code: string
  taskId: string
  errMsg?: string
  first_id?: string  // the first id of either content or draft
  new_id?: string    // the new id of either content or draft
}

/** Res_SyncSet on cloud end */
export interface Res_SyncSet_Cloud {
  results: SyncSetAtomRes[]
  plz_enc_results?: SyncSetAtomRes[]
}


/*********************** 关于下载同步 **********************/

export type SyncGetCtxKey = "users" | "members" | "contents" | "collections"

export interface SyncGetCtx {

  // collections
  users: Table_User[],
  members: Table_Member[],
  contents: Table_Content[],
  collections: Table_Collection[],

  // authors
  authors: LiuDownloadAuthor[],

  // my data
  me: Table_User    // TODO: it might be optional for visitors

  // the list of workspace ids that the user is in
  space_ids: string[]     // TODO: it might be optional for visitors
}

export type SyncGetTable = Table_User | Table_Content | 
  Table_Member | Table_Collection


/*********************** 数据表类型 **********************/

export type TableName = "User" | "Workspace" | "Member" | "Content"
  | "Draft" | "Collection"

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
  open_id?: string
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

  /** wechat data */
  wx_gzh_openid?: string

  /** wecom data for qynb, which is for company internal use */
  ww_qynb_external_userid?: string

  userAgent?: string
  timezone?: string
  
}

/** Workspace 表 */
export interface Table_Workspace extends BaseTable {
  infoType: SpaceType
  stateConfig?: LiuStateConfig
  tagList?: TagView[]
  oState: OState
  owner: string
  name?: string
  avatar?: Cloud_ImageStore
  editedStamp?: number       // 同步时，用来比大小的
  config?: WorkspaceConfig
}

/** Member 表 */
export interface Table_Member extends BaseTable {
  spaceType: SpaceType
  name?: string
  avatar?: Cloud_ImageStore
  spaceId: string
  user: string
  oState: OState_3
  config?: MemberConfig
  notification?: MemberNotification
  editedStamp?: number      // 同步时，用来比大小的
}

/** 屏蔽表: 目前用于许可特定 email */
export interface Table_AllowList extends BaseTable {
  type: "email"
  isOn: BaseIsOn
  value: string
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

  infoType: ContentInfoType
  oState: OState
  visScope: VisScope
  storageState: Cloud_StorageState

  enc_title?: CryptoCipherAndIV
  enc_desc?: CryptoCipherAndIV
  enc_images?: CryptoCipherAndIV
  enc_files?: CryptoCipherAndIV
  enc_search_text?: CryptoCipherAndIV

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
  removedStamp?: number

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

  enc_title?: CryptoCipherAndIV
  enc_desc?: CryptoCipherAndIV
  enc_images?: CryptoCipherAndIV
  enc_files?: CryptoCipherAndIV

  whenStamp?: number
  remindMe?: LiuRemindMe
  tagIds?: string[]
  editedStamp: number       // 草稿被用户实际编辑的时间戳
}

/** 表态和收藏表 */
export interface Table_Collection extends BaseTable {
  first_id: string
  oState: OState_2
  user: string
  member?: string
  infoType: CollectionInfoType
  forType: ContentInfoType
  spaceId: string
  spaceType: SpaceType
  content_id: string
  operateStamp: number     // 比对前后端冲突时所用
  sortStamp: number        // 用于收藏列表中的排序
  emoji?: string        // 经 encodeURIComponent() 的表情
}


export interface Config_WeChat_GZH {
  access_token?: string
  expires_in?: number      // how many seconds left before it expires
  lastGetStamp?: number   // Timestamp of the last time access_token was obtained
}

export interface Config_WeCom_Qynb {
  access_token?: string
  expires_in?: number
  lastGetStamp?: number
}

export interface Table_Config extends BaseTable {

  // RSA Key Pair in PEM format
  publicKey: string
  privateKey: string

  // AES-GCM Key in base64 format
  aesKey?: string
  // AES-GCM IV in base64 format
  aesIV?: string

  // wechat subscription
  wechat_gzh?: Config_WeChat_GZH

  // wecom config for company internal development
  // qynb means 企业内部（开发）
  wecom_qynb?: Config_WeCom_Qynb

}

/** 临时凭证表的类型 */
export type Table_Credential_Type =  "sms-code" | "email-code" | "scan-code"
  | "users-select" | "stripe-checkout-session" | "bind-wecom" | "bind-wechat"

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

/*********************** 云函数入参 & 出参类型 ***********************/
// Res_ 开头表示回传的数据
// Param_ 开头表示入参数据

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
  customKey: vbot.string(),
  endUser: Sch_Opt_Str,
})

export interface Res_ULN_User extends LiuSpaceAndMember {
  userId: string
  createdStamp: number
}

export interface Res_UserLoginNormal {
  // 需要验证 email 时或只有一个 user 符合时
  email?: string

  // 只有一个 user 符合时
  open_id?: string
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
  open_id?: string
  github_id?: number
  theme: LocalTheme
  language: LocalLocale
  spaceMemberList: LiuSpaceAndMember[]
  subscription?: UserSubscription
  
  /** wechat data */
  wx_gzh_openid?: string

  /** wecom data for qynb, which is for company internal use */
  ww_qynb_external_userid?: string

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

/****************** sync-get: request ***************/
interface SyncGet_Base {
  taskId: string
}

const Sch_SyncGet_Base = vbot.object({
  taskId: Sch_Id,
})

export interface SyncGet_ThreadList {
  taskType: "thread_list"
  spaceId: string
  viewType: ThreadListViewType

  // 每次最多加载多少个，默认为 cfg.default_limit.num
  //（该值是计算过，在 1980px 的大屏上也可以触发触底加载的）
  // 限制在 1 到 32 之间，默认 16
  limit?: number

  // 加载收藏
  collectType?: CollectionInfoType

  // 加载某个 emoji
  emojiSpecific?: string

  // 加载某个标签
  tagId?: string

  // 默认为降序，desc
  sort?: SortWay

  // 已加载出来的最后一个 id 的 createdStamp 或 updatedStamp 或 myFavoriteStamp 或 myEmojiStamp
  // 根据 collectType 和 oState 的不同，用不同 item 的属性
  lastItemStamp?: number

  // 加载特定的动态，限制在 0 ～ 32 个元素
  specific_ids?: string[]

  // 排除某些动态，限制在 0 ～ 32 个元素
  excluded_ids?: string[]

  // 加载特定状态的动态
  stateId?: string
}

export const Sch_SyncGet_ThreadList = vbot.object({
  taskType: vbot.literal("thread_list"),
  spaceId: Sch_Id,
  viewType: Sch_ThreadListViewType,
  limit: sch_opt_num(1, 32),
  collectType: vbot.optional(Sch_CollectionInfoType),
  emojiSpecific: Sch_Opt_Str,
  tagId: Sch_Opt_Str,
  sort: vbot.optional(Sch_SortWay),
  lastItemStamp: Sch_Opt_Num,
  specific_ids: sch_opt_arr(Sch_Id, [vbot.maxLength(32)]),
  excluded_ids: sch_opt_arr(Sch_Id, [vbot.maxLength(32)]),
  stateId: Sch_Opt_Str,
})

export interface SyncGet_ThreadData {
  taskType: "thread_data"
  id: string
}

export const Sch_SyncGet_ThreadData = vbot.object({
  taskType: vbot.literal("thread_data"),
  id: Sch_Id,
})

export interface SyncGet_CommentList_A {
  taskType: "comment_list"
  loadType: "under_thread"
  targetThread: string
  lastItemStamp?: number
  sort?: SortWay    // asc is default
  limit?: number    // 9 is default
}

export const Sch_SyncGet_CommentList_A = vbot.object({
  taskType: vbot.literal("comment_list"),
  loadType: vbot.literal("under_thread"),
  targetThread: Sch_Id,
  lastItemStamp: Sch_Opt_Num,
  sort: vbot.optional(Sch_SortWay),
  limit: sch_opt_num(1, 32),
})

export interface SyncGet_CommentList_B {
  taskType: "comment_list"
  loadType: "find_children"
  commentId: string
  lastItemStamp?: number
  sort?: SortWay    // asc is default
  limit?: number    // 9 is default
}

export const Sch_SyncGet_CommentList_B = vbot.object({
  taskType: vbot.literal("comment_list"),
  loadType: vbot.literal("find_children"),
  commentId: Sch_Id,
  lastItemStamp: Sch_Opt_Num,
  sort: vbot.optional(Sch_SortWay),
  limit: sch_opt_num(1, 32),
})

export interface SyncGet_CommentList_C {
  taskType: "comment_list"
  loadType: "find_parent"
  parentWeWant: string
  grandparent?: string
  batchNum?: number   // 2 is default
}

export const Sch_SyncGet_CommentList_C = vbot.object({
  taskType: vbot.literal("comment_list"),
  loadType: vbot.literal("find_parent"),
  parentWeWant: Sch_Id,
  grandparent: Sch_Opt_Id,
  batchNum: sch_opt_num(1, 4),
})

export interface SyncGet_CommentList_D {
  taskType: "comment_list"
  loadType: "find_hottest"
  commentId: string
}

export const Sch_SyncGet_CommentList_D = vbot.object({
  taskType: vbot.literal("comment_list"),
  loadType: vbot.literal("find_hottest"),
  commentId: Sch_Id,
})

export type SyncGet_CommentList = SyncGet_CommentList_A | 
  SyncGet_CommentList_B | SyncGet_CommentList_C | SyncGet_CommentList_D

export const Sch_SyncGet_CommentList = vbot.variant("loadType", [
  Sch_SyncGet_CommentList_A,
  Sch_SyncGet_CommentList_B,
  Sch_SyncGet_CommentList_C,
  Sch_SyncGet_CommentList_D,
])

export interface SyncGet_CheckContents {
  taskType: "check_contents"
  ids: string[]
}

export const Sch_SyncGet_CheckContents = vbot.object({
  taskType: vbot.literal("check_contents"),
  ids: vbot.array(Sch_Id, [
    vbot.minLength(1),
    vbot.maxLength(32),
  ]),
})

export interface SyncGet_Draft {
  taskType: "draft_data"
  draft_id?: string
  threadEdited?: string
  commentEdited?: string
  spaceId?: string
}

export const Sch_SyncGet_Draft = vbot.object({
  taskType: vbot.literal("draft_data"),
  draft_id: Sch_Opt_Id,
  threadEdited: Sch_Opt_Id,
  commentEdited: Sch_Opt_Id,
  spaceId: Sch_Opt_Id,
})

export type CloudMergerOpt = SyncGet_ThreadList | SyncGet_ThreadData |
SyncGet_CommentList | SyncGet_CheckContents | SyncGet_Draft

export const Sch_CloudMergerOpt = vbot.variant("taskType", [
  Sch_SyncGet_ThreadList,
  Sch_SyncGet_ThreadData,
  Sch_SyncGet_CommentList,
  Sch_SyncGet_CheckContents,
  Sch_SyncGet_Draft,
])

export type SyncGetAtom = CloudMergerOpt & SyncGet_Base
export const Sch_SyncGetAtom = vbot.intersect([
  Sch_CloudMergerOpt,
  Sch_SyncGet_Base,
])

/****************** sync-get: response ***************/
export type LiuDownloadStatus = "has_data" | "not_found" | "no_auth"

export interface LiuDownloadCollection {
  _id: string
  first_id: string
  user: string
  member?: string
  oState: OState_2
  emoji?: string   // the emoji through encodeURIComponent()
  operateStamp: number     // 比对前后端冲突时所用
  sortStamp: number        // 用于收藏列表中的排序
}

export interface LiuDownloadAuthor {
  space_id: string  // 注意！这个字段的值，可能与 LiuDownloadContent.spaceId 不一致
  user_id: string
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
  removedStamp?: number

  tagIds?: string[]         // 用于显示的 tagId
  tagSearched?: string[]      // 用于搜索的 tagId 要把 tagIds 的 parent id 都涵盖进来
  stateId?: string
  config?: ContentConfig
  search_title?: string
  search_other?: string

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

export interface Res_SyncGet_Cloud {
  results: SyncGetAtomRes[]
  plz_enc_results?: SyncGetAtomRes[]
}

/******************** open-connect **********************/
export type OpenConnectOperate = "bind-wecom" | "check-wecom" | "get-wechat"
  | "set-wechat" | "bind-wechat" | "check-wechat"

export type CheckBindStatus = "waiting" | "plz_check" | "expired"

export interface Param_OC_SetWechat {
  operateType: "set-wechat"
  memberId: string
  ww_qynb_toggle?: boolean
  wx_gzh_toggle?: boolean
}

export const Sch_Param_OC_SetWechat = vbot.object({
  operateType: vbot.literal("set-wechat"),
  memberId: vbot.string(),
  ww_qynb_toggle: Sch_Opt_Bool,
  wx_gzh_toggle: Sch_Opt_Bool,
})

export interface Res_OC_BindWeCom {
  operateType: "bind-wecom"
  pic_url: string
  credential: string
}

export interface Res_OC_CheckWeCom {
  operateType: "check-wecom"
  status: CheckBindStatus
}

export interface Res_OC_BindWeChat {
  operateType: "bind-wechat"
  qr_code: string
  credential: string
}

export interface Res_OC_CheckWeChat {
  operateType: "check-wechat"
  status: CheckBindStatus
}

export interface Res_OC_GetWeChat {
  operateType: "get-wechat"
  ww_qynb_external_userid?: string
  ww_qynb_toggle?: boolean
  wx_gzh_openid?: string
  wx_gzh_toggle?: boolean
  wx_gzh_subscribed?: boolean
}



/******************** 一些云函数间内部的入参和出参类型 **********/

export interface VerifyTokenOpt {
  entering?: boolean         // 当前调用是否为 `user-login` 的 enter
  isRead?: boolean           // 当前调用为读取操作
  isSet?: boolean            // 当前调用为写入操作
}

export interface VerifyTokenRes_A {
  pass: false
  rqReturn: LiuRqReturn
}

export interface VerifyTokenRes_B {
  pass: true
  tokenData: Table_Token
  userData: Table_User
  workspaces: string[]

  new_token?: string
  new_serial?: string
}

export type VerifyTokenRes = VerifyTokenRes_A | VerifyTokenRes_B

/*********************** 缓存类型 **********************/

export interface Shared_RSA_Key_Pair {
  publicKey: string
  privateKey: string
}

export interface Shared_AES_Key_IV {
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

/******************* Some Types from WeChat ****************/

// common result: { errcode: 0, errmsg: "ok" }  
export interface Wx_Res_Common {
  errcode: number
  errmsg: string
}


/** result of creating QR */
export interface Wx_Res_Create_QR {
  ticket: string
  expire_seconds: number
  url: string
}

export interface Wx_Res_GzhUserInfo {
  subscribe: 0 | 1      // 0: unsubscribed    1: subscribed
  openid: string
  language?: string
  subscribe_time?: number       // the timestamp (sec) when user subscribed
  unionid?: string
  remark?: string
  groupid?: number
  tagid_list?: number[]
  subscribe_scene?: string
  qr_scene?: number
  qr_scene_str?: string
}

export interface Wx_Param_Msg_Templ_Send {
  touser: string
  template_id: string
  url?: string
  client_msg_id?: string
  data: Record<string, Record<"value", string>>
}


/******************* WeChat Subscription Msg Events ****************/
export interface Wx_Gzh_Base {
  ToUserName: string
  FromUserName: string
  CreateTime: string    // integer which represents timestamp (seconds)
}

// authorization_change from user
// https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/authorization_change.html

export type Wx_Gzh_Auth_Change_Event = "user_info_modified" | 
  "user_authorization_revoke" |
  "user_authorization_cancellation"

export interface Wx_Gzh_Auth_Change extends Wx_Gzh_Base {
  MsgType: "event"
  Event: Wx_Gzh_Auth_Change_Event
  OpenID: string
  AppID: string
  RevokeInfo?: string
}

// receive basic message from user
// https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_standard_messages.html
export interface Wx_Gzh_Text extends Wx_Gzh_Base {
  MsgType: "text"
  Content: string    // if we got unsupported message, it would be: "[收到不支持的消息类型，暂无法显示]"
  MsgId: string
  MsgDataId?: string
}

export interface Wx_Gzh_Image extends Wx_Gzh_Base {
  MsgType: "image"
  PicUrl: string
  MediaId: string
  MsgId: string
  MsgDataId?: string
}

export interface Wx_Gzh_Voice extends Wx_Gzh_Base {
  MsgType: "voice"
  MediaId: string
  Format: string       // e.g. "amr"，"speex"
  MsgId: string
  MsgDataId?: string
  recognition?: string
  MediaId16K?: string
}

export interface Wx_Gzh_Video extends Wx_Gzh_Base {
  MsgType: "video"
  MediaId: string
  ThumbMediaId: string
  MsgId: string
  MsgDataId?: string
}

export interface Wx_Gzh_ShortVideo extends Wx_Gzh_Base {
  MsgType: "shortvideo"
  MediaId: string
  ThumbMediaId: string
  MsgId: string
  MsgDataId?: string
}

// TODO: Location
export interface Wx_Gzh_Location extends Wx_Gzh_Base {
  MsgType: "location"
  Location_X: string  // 纬度, e.g. "26.953295"
  Location_Y: string  // 经度, e.g. "100.212433"
  Scale: string       // 缩放大小, e.g. "15"
  Label: string       // description, e.g. 玉龙纳西族自治县Y010与新尚段交叉口
  MsgId: string
  MsgDataId?: string
}

export interface Wx_Gzh_Link extends Wx_Gzh_Base {
  MsgType: "link"
  Title: string
  Description: string
  Url: string
  MsgId: string
  MsgDataId?: string
}

// @see "发送菜单消息" https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Service_Center_messages.html#4:~:text=ARTICLE_ID%22%0A%20%20%20%20%7D%0A%7D-,%E5%8F%91%E9%80%81%E8%8F%9C%E5%8D%95%E6%B6%88%E6%81%AF,-%7B%0A%20%20%22touser%22
export interface Wx_Gzh_MsgMenu extends Wx_Gzh_Base {
  MsgType: "text"
  Content: string
  MsgId: string
  bizmsgmenuid: string
}

// subscribe or unsubscribe from user
export interface Wx_Gzh_Subscribe extends Wx_Gzh_Base {
  MsgType: "event"
  Event: "subscribe"
  EventKey: string     // If available, qrscene_ is the prefix 
                       // followed by the parameter value of the QR code
  Ticket?: string
}

export interface Wx_Gzh_Unsubscribe extends Wx_Gzh_Base {
  MsgType: "event"
  Event: "unsubscribe"
  EventKey: string
}

// scan qrcode when the user has subscribed in advance
export interface Wx_Gzh_Scan extends Wx_Gzh_Base {
  MsgType: "event"
  Event: "SCAN"
  EventKey: string
  Ticket: string
}

// user clicks on the menu and pull a message
export interface Wx_Gzh_Click extends Wx_Gzh_Base {
  MsgType: "event"
  Event: "CLICK"
  EventKey: string    // which is equal to the key to the custom menu
}

// user clicks on the menu and navigate to a URL
export interface Wx_Gzh_View extends Wx_Gzh_Base {
  MsgType: "event"
  Event: "VIEW"
  EventKey: string     // URL to be opened
  MenuId?: string      // the key exists after testing
}

export interface Wx_Gzh_Tmpl_Send extends Wx_Gzh_Base {
  MsgType: "event"
  Event: "TEMPLATESENDJOBFINISH"
  MsgId: string
  Status: string
}


export type Wx_Gzh_Msg_Event = Wx_Gzh_Auth_Change |
  Wx_Gzh_Text |
  Wx_Gzh_Image |
  Wx_Gzh_Voice |
  Wx_Gzh_Subscribe |
  Wx_Gzh_Unsubscribe |
  Wx_Gzh_Scan |
  Wx_Gzh_Click |
  Wx_Gzh_View |
  Wx_Gzh_Tmpl_Send

/******************* Some Types from WeCom  ****************/
export interface Ww_Res_Base {
  errcode: number
  errmsg: string
}

export interface Ww_Res_Add_Contact_Way extends Ww_Res_Base {
  config_id: string
  qr_code?: string
}

// @see https://developer.work.weixin.qq.com/document/path/92114#13878
export interface Ww_External_Contact {
  external_userid: string
  name: string
  avatar?: string
  type: 1 | 2         // 1: WeChat user;  2: WeCom user
  gender: 0 | 1 | 2   // 0: unknown;  1: male;  2: female
  unionid?: string

  // properties only for WeCom users
  position?: string
  corp_name?: string
  corp_full_name?: string
}

export interface Ww_Follow_User_Tag {
  group_name: string
  tag_name: string
  type: 1 | 2 | 3       // 1: set by enterprise;  2: set by user;  3: set by rule
  tag_id?: string
}

export interface Ww_Wechat_Channels {
  nickname: string
  source: 0 | 1 | 2 | 3
}


// @see https://developer.work.weixin.qq.com/document/path/92114#13878
export interface Ww_Follow_User {
  userid: string
  remark: string
  description: string
  createtime: number       // the stamp when the wecom member added the user (sec)
  tags?: Ww_Follow_User_Tag[]
  remark_corp_name?: string
  remark_mobiles?: string[]
  add_way: number         // see https://developer.work.weixin.qq.com/document/path/92114#%E6%9D%A5%E6%BA%90%E5%AE%9A%E4%B9%89
  wechat_channels?: Ww_Wechat_Channels
  oper_userid: string
  state?: string
}

export interface Ww_Res_User_Info extends Ww_Res_Base {
  external_contact: Ww_External_Contact
  follow_user: Ww_Follow_User[]
  next_cursor?: string
}

/********** Send Welcome message for WeCom *********/

export interface Ww_Wel_Text {
  content: string
}

export interface Ww_Wel_Attachment_Image {
  msgtype: "image"
  image: {
    media_id?: string
    pic_url?: string   // 仅可使用上传图片接口得到的链接
  }
}

export interface Ww_Wel_Attachment_Link {
  msgtype: "link"
  link: {
    title: string
    picurl?: string
    desc?: string
    url: string
  }
}

export interface Ww_Wel_Attachment_Miniprogram {
  msgtype: "miniprogrampage"
  miniprogrampage: {
    title: string
    pic_media_id: string    // 封面图建议尺寸为520*416
    appid: string           // 必须是关联到企业的小程序应用
    page: string
  }
}

export interface Ww_Wel_Attachment_Video {
  msgtype: "video"
  video: {
    media_id: string
  }
}

export interface Ww_Wel_Attachment_File {
  msgtype: "file"
	file: {
    media_id: string
  }
}

export type Ww_Wel_Attachment = Ww_Wel_Attachment_Image
  | Ww_Wel_Attachment_Link
  | Ww_Wel_Attachment_Miniprogram
  | Ww_Wel_Attachment_Video
  | Ww_Wel_Attachment_File

export interface Ww_Welcome_Body {
  welcome_code: string
  text?: Ww_Wel_Text
  attachments?: Ww_Wel_Attachment[]
}

/********** Event Webhook from WeCom *********/

export interface Ww_Msg_Base {
  ToUserName: string
  FromUserName: string
  CreateTime: string       // integer which represents timestamp (seconds)
}

// 微信用户添加企业微信联系人时
export interface Ww_Add_External_Contact extends Ww_Msg_Base {
  MsgType: "event"
  Event: "change_external_contact"
  ChangeType: "add_external_contact"
  UserID: string
  ExternalUserID: string
  State?: string
  WelcomeCode: string
}

// 微信用户删除企业微信联系人时
export interface Ww_Del_Follow_User extends Ww_Msg_Base {
  MsgType: "event"
  Event: "change_external_contact"
  ChangeType: "del_follow_user"
  UserID: string
  ExternalUserID: string
}

// 客户（微信用户）同意进行聊天内容存档
export interface Ww_Msg_Audit_Approved extends Ww_Msg_Base {
  MsgType: "event"
  Event: "change_external_contact"
  ChangeType: "msg_audit_approved"
  UserID: string
  ExternalUserID: string
  WelcomeCode?: string
}

// 当有新的会话产生时，会话内容存档服务会触发此事件
export interface Ww_Msg_Audit_Notify extends Ww_Msg_Base {
  MsgType: "event"
  Event: "msgaudit_notify"
  AgentID: string
}

export type Ww_Msg_Event = Ww_Add_External_Contact | Ww_Del_Follow_User
  | Ww_Msg_Audit_Approved | Ww_Msg_Audit_Notify

