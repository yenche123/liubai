import type { FileShow } from "~/types"
import type { LiuRemindMe } from "~/types/types-atom"
import type { CeData } from "../../tools/types"
import type { PropType } from "vue"
import type { TipTapEditor } from "~/types/types-editor"
import type { StateShow } from "~/types/types-content"
import type { BaseIsOn } from "~/types/types-basic"

export type CmaRemindType = "early" | "later"

export interface MaData {
  whenStr: string
  remindMeStr: string
  title: string
  site: string
  fileShow?: FileShow
  syncCloud: boolean
  scDisabled: boolean
  aiReadable: BaseIsOn
  aiReadDisabled: boolean

  // 浅浅记录一下 什么时候的 Date 类型，这样子再选择时，定位到该日期
  whenDate?: Date

  // 状态
  stateShow?: StateShow

  // 提醒我的类型，分成 early (准时 / 提前10分钟..) 和 later (30分钟后 / 1小时后.....)
  remindType: CmaRemindType
}

export interface MoreAreaEmits {
  (event: "whenchange", val: Date | null): void
  (event: "remindmechange", val: LiuRemindMe | null): void
  (event: "titlechange", val: string): void
  (event: "synccloudchange", val: boolean): void
  (event: "aireadablechange", val: boolean): void
  (event: "filechange", val: File[] | null): void
  (event: "statechange", val: string | null): void
}

export interface MaContext {
  props: CmaProps
  emits: MoreAreaEmits
  data: MaData
}

export interface CmaProps {
  editor?: TipTapEditor
  show: boolean
  ceData?: CeData
}

export const cmaProps = {
  editor: Object as PropType<TipTapEditor>,
  show: {
    type: Boolean,
    default: false,
  },
  ceData: Object as PropType<CeData>,
}

export const cmaEmits = {
  whenchange: (val: Date | null) => true,
  remindmechange: (val: LiuRemindMe | null) => true,
  titlechange: (val: string) => true,
  synccloudchange: (val: boolean) => true,
  aireadablechange: (val: boolean) => true,
  filechange: (val: File[] | null) => true,
  statechange: (val: string | null) => true,
}