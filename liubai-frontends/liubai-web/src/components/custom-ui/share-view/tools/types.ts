import type { VisScope } from "~/types/types-basic"

export interface ShareViewParam {
  threadId: string
  visScope: VisScope
  allowComment?: boolean
}

export type ShareViewRes = true

export type SvResolver = (res: ShareViewRes) => void