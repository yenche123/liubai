
export interface SearchEditorPram {
  type: "search" | "select_thread"      // 通用搜索、选择一条动态
  excludeThreads?: string[]
}

export interface SearchEditorRes {
  action: "confirm" | "cancel"
  areaType: "suggestion" | "third_party" | "inner"
  threadId?: string      // 当 action 为 "confirm" 并且 areaType 为 "inner" 时【必有值】
  commentId?: string
}