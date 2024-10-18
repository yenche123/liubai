import type { TagView } from "~/types/types-atom"

export interface TmData {
  toPath: string
  tagNodes: TagView[]
  oldTagNodes: TagView[]
  lastTagChangeStamp: number
  everMoved: boolean
}