// 评论加载管理器
import { db } from "~/utils/db"
import type { LoadByThreadOpt, LoadByCommentOpt } from "./tools/types"
import type { ContentLocalTable } from "~/types/types-table"
import type { CommentShow } from "~/types/types-content"
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

// 处理 list 之间的关系，即判断 prevIReplied 和 nextRepliedMe 两个属性
// 注意，这个函数为 void，它会直接修改数组或对象的值
function handleRelation(
  list: CommentShow[],
  prevComment?: CommentShow,
  nextComment?: CommentShow,
) {
  const length = list.length
  if(length < 1) return

  // 处理开头
  const tmpFirst = list[0]
  if(prevComment) {
    if(prevComment._id === tmpFirst.replyToComment) {
      if(!prevComment.nextRepliedMe) prevComment.nextRepliedMe = true
      if(!tmpFirst.prevIReplied) tmpFirst.prevIReplied = true
    }
    else {
      if(prevComment.nextRepliedMe) prevComment.nextRepliedMe = false
      if(tmpFirst.prevIReplied) tmpFirst.prevIReplied = false
    }
  }

  // 处理中间
  for(let i=1; i<length; i++) {
    const v = list[i]
    const prevOne = list[i - 1]

    const re = v.replyToComment
    if(re && re === prevOne._id) {
      if(!prevOne.nextRepliedMe) prevOne.nextRepliedMe = true
      if(!v.prevIReplied) v.prevIReplied = true
    }
    else {
      if(prevOne.nextRepliedMe) prevOne.nextRepliedMe = false
      if(v.prevIReplied) v.prevIReplied = false
    }
  }

  // 处理尾巴
  const tmpLast = list[length - 1]
  if(nextComment) {
    if(tmpLast._id === nextComment.replyToComment) {
      if(!tmpLast.nextRepliedMe) tmpLast.nextRepliedMe = true
      if(!nextComment.prevIReplied) nextComment.prevIReplied = true
    }
    else {
      if(tmpLast.nextRepliedMe) tmpLast.nextRepliedMe = false
      if(nextComment.prevIReplied) nextComment.prevIReplied = false
    }
  }
}


export default {
  loadByThread,
  loadByComment,
  handleRelation,
}