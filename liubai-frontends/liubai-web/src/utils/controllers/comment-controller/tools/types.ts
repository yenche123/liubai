

export interface LoadByThreadOpt {
  targetThread: string
  lastItemStamp?: number
}

export interface LoadByCommentOpt {
  targetComment: string
  direction: "down" | "up"        // 往下加载 或 往上加载，每次加载 3 条出来
  containTarget?: boolean         // 是否要把 targetComment 也加载出来，默认为 true
}

