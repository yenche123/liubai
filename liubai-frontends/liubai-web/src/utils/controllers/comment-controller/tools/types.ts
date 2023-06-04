

export interface LoadByThreadOpt {
  targetThread: string
  lastItemStamp?: number
}

export interface LoadByCommentOpt {
  targetComment: string
  loadType: "find_children" | "find_parent"
  lastItemStamp?: number                    // 仅当 loadType 为 "find_children" 时有意义，
                                            // 表示最后一个 item 的创建时间戳
  currentParent?: string                    // 仅当 loadType 为 "find_children" 时有意义，
                                            // 表示当前已加载到某个 parent 了，继续再往上溯源
}

