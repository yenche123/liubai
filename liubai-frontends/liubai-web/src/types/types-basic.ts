
export type BaseIsOn = "Y" | "N"
export type TrueOrFalse = "T" | "F"
export type LiuYorN = BaseIsOn | "U"        // "U" means unknown

// oState for content and workspace
export type OState = "OK" | "REMOVED" | "DELETED"

// collection's oState
export type OState_2 = "OK" | "CANCELED"

// member's oState
export type OState_3 = "OK" | "LEFT" | "DEACTIVATED" | "DELETED"

// draft's oState
export type OState_Draft = "OK" | "POSTED" | "DELETED" | "LOCAL"
export type VisScope = "DEFAULT" | "PUBLIC" | "LOGIN_REQUIRED"
export type StorageState = "CLOUD" | "WAIT_UPLOAD" | "LOCAL" | "ONLY_LOCAL"
export type SortWay = "desc" | "asc"   // 降序和升序
export type SpaceType = "ME" | "TEAM"