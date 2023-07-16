// 一些关于评论的工具函数

import type { CommentShow } from "~/types/types-content";


/**
 * 获取有价值的评论，经加权分数由高至低排序
 */
export function getValuedComments(
  list: CommentShow[]
) {
  let tmpList = list.filter(v => {
    if(v.oState !== "OK") return false
    if(!v.commentNum) return false
    return true
  })
  if(tmpList.length < 1) return []
  let tmpList2 = tmpList.map(v => {
    let score = (5 * v.commentNum) + (3 * v.emojiData.total)
    return {
      _id: v._id,
      score,
    }
  }).sort((v1, v2) => {
    let diff = v2.score - v1.score
    return diff
  })
  return tmpList2
}