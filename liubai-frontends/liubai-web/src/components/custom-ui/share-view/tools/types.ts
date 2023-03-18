import type { VisScope } from "~/types/types-basic"
import { ThreadShow } from "~/types/types-content"
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
}

export type ShareViewRes = true

export type SvResolver = (res: ShareViewRes) => void

export type IcsDateTime = [number, number, number, number, number]

export interface ExportData {
  title: string
  desc: string
  startStamp?: number
  alarms?: Alarm[]
}