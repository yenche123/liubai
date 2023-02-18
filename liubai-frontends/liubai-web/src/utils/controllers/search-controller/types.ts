

export type ScMode = "search" | "select_thread"      // 通用搜索、选择一条动态

export interface ScContentAtom {
  atomId: string
  title: string
  desc?: string
  threadId: string
  commentId?: string
  imgUrl?: string
}

export interface ScRecentAtom {
  atomId: string         // "recent_xxxxx"
  title: string
}

export interface ScThirdPartyAtom {
  atomId: "bing" | "xhs" | "github"
}

