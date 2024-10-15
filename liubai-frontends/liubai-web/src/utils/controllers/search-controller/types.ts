import type { ImageShow } from "~/types"


export type ScMode = "search" | "select_thread"      // 通用搜索、选择一条动态（包含新建动态）

export interface ScContentAtom {
  atomId: string
  title: string
  desc?: string
  threadId: string
  commentId?: string
  imgShow?: ImageShow
}

export interface ScRecentAtom {
  atomId: string         // "recent_xxxxx"
  title: string
}

export type ScThirdPartyType = "bing" | "xhs" | "github"

export interface ScThirdPartyAtom {
  atomId: ScThirdPartyType
}

export interface SearchOpt {
  mode: ScMode
  text?: string
  excludeThreads?: string[]
}

