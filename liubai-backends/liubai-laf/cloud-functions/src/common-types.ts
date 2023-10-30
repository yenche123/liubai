// 全局类型
// Table_ 开头，表示为数据表结构
// Shared_ 开头，表示为全局缓存 cloud.shared 所涉及的结构

export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}


/*********************** 基类型、原子化类型 **********************/

type BaseIsOn = "Y" | "N"

type OState = "OK" | "REMOVED" | "DELETED"

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

/** Member表对象的配置结构 */
export interface MemberConfig {
  searchKeywords: string[]
  searchTagIds?: string[]
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
  infoType: "ME" | "TEAM"
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


/** 屏蔽表 */
export interface Table_BlockList extends BaseTable {
  type: "ip"
  isOn: BaseIsOn
  value: string
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
