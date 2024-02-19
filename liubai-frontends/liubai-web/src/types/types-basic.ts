
export type BaseIsOn = "Y" | "N"
export type TrueOrFalse = "true" | "false"
export type OState = "OK" | "REMOVED" | "DELETED"
export type OState_2 = "OK" | "CANCELED"
export type VisScope = "DEFAULT" | "PUBLIC" | "LOGIN_REQUIRED"
export type StorageState = "CLOUD" | "WAIT_UPLOAD" | "LOCAL" | "ONLY_LOCAL"
export type SortWay = "desc" | "asc"   // 降序和升序

// EXTERNAL 字段不会存储在 db 里，而是运行时判别用户不是该工作区成员时，使用的属性值
export type MemberState = "OK" | "LEFT" | "DEACTIVATED" | "DELETED" | "EXTERNAL"
export type SpaceType = "ME" | "TEAM"