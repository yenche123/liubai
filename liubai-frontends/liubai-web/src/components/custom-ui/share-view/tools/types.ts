import type { VisScope } from "~/types/types-basic"
import { ThreadShow } from "~/types/types-content"

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
}

export type ShareViewRes = true

export type SvResolver = (res: ShareViewRes) => void

export interface ExportData {
  title: string
  desc: string
  startStamp?: number
}