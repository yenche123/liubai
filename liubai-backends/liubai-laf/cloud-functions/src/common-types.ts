// 全局类型
// Table_ 开头，表示为数据表结构
// Shared_ 开头，表示为全局缓存 cloud.shared 所涉及的结构

export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}


/*********************** 基类型 **********************/

type BaseIsOn = "Y" | "N"

interface BaseTable {
  _id: string
  insertedStamp: number
  updatedStamp: number
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
