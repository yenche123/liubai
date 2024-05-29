// 一些关于评论的工具函数

import { StorageState } from "~/types/types-basic";
import type { CommentShow } from "~/types/types-content";


export interface ValueComment {
  _id: string
  first_id: string
  storageState: StorageState
  score: number
}

/**
 * 获取有价值的评论，经加权分数由高至低排序
 */
export function getValuedComments(
  list: CommentShow[]
): ValueComment[] {
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
      first_id: v.first_id,
      storageState: v.storageState,
      score,
    }
  }).sort((v1, v2) => {
    let diff = v2.score - v1.score
    return diff
  })
  return tmpList2
}