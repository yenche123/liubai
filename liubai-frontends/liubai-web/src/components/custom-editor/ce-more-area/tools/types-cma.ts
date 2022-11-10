import type { LiuRemindMe } from "../../../../types/types-atom"
import { CeState } from "../../tools/types-ce"


export type CmaRemindType = "early" | "later"

export interface MaData {
  whenStr: string
  remindMeStr: string
  title: string
  site: string
  attachment: string
  syncCloud: boolean
  scDisabled: boolean

  // 浅浅记录一下 什么时候的 Date 类型，这样子再选择时，定位到该日期
  whenDate?: Date

  // 提醒我的类型，分成 early (准时 / 提前10分钟..) 和 later (30分钟后 / 1小时后.....)
  remindType: CmaRemindType
}

export interface MoreAreaEmits {
  (event: "whenchange", val: Date | null): void
  (event: "remindmechange", val: LiuRemindMe | null): void
  (event: "titlechange", val: string): void
  (event: "synccloudchange", val: boolean): void
}

export interface MaContext {
  emits: MoreAreaEmits
  data: MaData
}

export interface CmaProps {
  show: boolean
  state?: CeState
}