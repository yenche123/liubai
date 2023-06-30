

export interface LoadByThreadOpt {
  targetThread: string
  lastItemStamp?: number
}

export interface LoadByCommentOpt {
  targetComment: string
  loadType: "target" | "find_children" | "find_parent"
    // target: 仅加载 targetComment
    // find_children: 加载回复 targetComment 的评论，也就是 targetComment 的一级评论
    // find_parent: 为 targetComment 溯源，直到找到 当前 thread 下的那个相符的一级、祖先评论

  lastItemStamp?: number                    // 仅当 loadType 为 "find_children" 时有意义，
                                            // 表示最后一个 item 的创建时间戳
  currentParent?: string                    // 仅当 loadType 为 "find_parent" 时有意义，
                                            // 表示当前已加载到某个 parent 了，继续再往上溯源
}

