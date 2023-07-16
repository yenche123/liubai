
export interface LoadByThreadOpt {
  targetThread: string
  lastItemStamp?: number
}

export interface LoadByCommentOpt {
  commentId: string
  loadType: "target" | "find_children" | "find_parent" | "find_hottest"
    // target: 仅加载 commentId 的评论
    // find_children: 加载回复 targetComment 的评论，也就是 targetComment 的一级评论
    // find_parent: 为 targetComment 溯源，直到找到 当前 thread 下的那个相符的一级、祖先评论
    // find_hottest: 找出最热门的子级评论（评论数+表态数加权）

  lastItemStamp?: number                    // 仅当 loadType 为 "find_children" 时有意义，
                                            // 表示最后一个 item 的创建时间戳
  parentWeWant?: string                     // 当 loadType 为 "find_parent" 时必填，
                                            // 表示请从 parentWeWant（包含）开始往上溯源
  grandparent?: string                      // 仅 loadType 为 "find_parent" 时有意义，选填
                                            // 若存在，可少一次加载
}

