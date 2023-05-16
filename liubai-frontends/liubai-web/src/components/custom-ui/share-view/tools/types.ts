import type { VisScope } from "~/types/types-basic"
import type { ThreadShow } from "~/types/types-content"
import type { Alarm } from "ics"

export interface ShareViewParam {
  threadId: string
  visScope: VisScope
  thread: ThreadShow
  allowComment?: boolean
}

export interface ShareViewData {
  public: boolean
  allowComment: boolean
  threadId: string
  copyLink: string
  googleCalendarLink: string
  outlookLink: string
  icsLink: string
  twitterLink: string
  emailLink: string
  lineLink: string
}

export type ShareViewRes = true

export type SvResolver = (res: ShareViewRes) => void

export type IcsDateTime = [number, number, number, number, number]

export interface ExportData {
  title: string          // thread 的标题
  desc: string           // thread 的内文
  content: string        // thread 的标题 + 内文（大于 140 字符，会修剪）
  content2: string       // thread 的标题 + 内文（完整的，不会修剪）
  startStamp?: number
  alarms?: Alarm[]
}