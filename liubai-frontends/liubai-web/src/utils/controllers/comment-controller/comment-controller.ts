// 评论加载管理器
import { db } from "~/utils/db"
import type { LoadByThreadOpt, LoadByCommentOpt } from "./tools/types"
import type { ContentLocalTable } from "~/types/types-table"
import { equipComments } from "../equip/comments"

/**
 * 已知 threadId 加载其下的评论
 *    这时，不要加载出已删除的评论，因为不影响阅读
 *    加载顺序: 依时间顺序，即越早发的在越前面
 */
async function loadByThread(opt: LoadByThreadOpt) {
  const { targetThread, lastItemStamp } = opt

  // 过滤掉 非一级的评论[和加载 lastItemStamp 以后的评论]
  const filterFunc = (item: ContentLocalTable) => {
    const { replyToComment, parentComment, createdStamp } = item
    if(replyToComment || parentComment) return false
    if(lastItemStamp) {
      if(createdStamp < lastItemStamp) return false
    }
    return true
  }

  const w = {
    parentThread: targetThread,
    oState: "OK",
  }

  let q = db.contents.where(w).filter(filterFunc)
  q = q.limit(9)
  const list = await q.sortBy("createdStamp")
  const comments = await equipComments(list)

  return comments
}


/**
 *  已知某个目标 comment 加载它的上下文
 *     向上加载时，必须加载出已删除的评论，这样才不会破坏 "上下文"
 */
async function loadByComment(opt: LoadByCommentOpt) {
  
}

export default {
  loadByThread,
  loadByComment
}