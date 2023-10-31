// 全局类型
// Table_ 开头，表示为数据表结构
// Shared_ 开头，表示为全局缓存 cloud.shared 所涉及的结构

export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}


/*********************** 基类型、原子化类型 **********************/

export type BaseIsOn = "Y" | "N"
export type OState = "OK" | "REMOVED" | "DELETED"
export type OState_2 = "OK" | "CANCELED"

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
  mimeType: string
  width?: number
  height?: number
  h2w?: string
  url: string
  url_2?: string             // 低分辨率的图片地址
  blurhash?: string
  someExif?: LiuExif
}


/*********************** 数据表类型 **********************/

/** Token表 */
export interface Table_Token extends BaseTable {
  token: string
  expireStamp: number
  userId: string
  isOn: BaseIsOn
  platform: "web"
  lastRead: number
  lastSet: number
}

/** User表 */
export interface Table_User extends BaseTable {
  oState: "NORMAL" | "DEACTIVATED" | "LOCK" | "REMOVED" | "DELETED"
  createdStamp: number
  email?: string
  phone?: string
  theme: "system" | "light" | "dark" | "auto"
  systemTheme?: "light" | "dark"
  language: "en" | "zh-Hans" | "zh-Hant"
  systemLanguage?: string
}

/** Workspace 表 */
export interface Table_Workspace extends BaseTable {
  infoType: SpaceType
  stateConfig?: Cloud_StateConfig
  tagList?: TagView[]
  oState: OState
  owner: string
}

/** Member 表 */
export interface Table_Member extends BaseTable {
  name?: string
  avatar?: Cloud_ImageStore
  spaceId: string
  user: string
  oState: "OK" | "LEFT" | "DEACTIVATED" | "DELETED"
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


/*********************** 缓存类型 **********************/

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
