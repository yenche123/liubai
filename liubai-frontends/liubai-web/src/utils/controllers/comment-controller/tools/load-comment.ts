
import { db } from "~/utils/db"
import { equipComments } from "../../equip/comments"
import time from "~/utils/basic/time"
import type { ContentLocalTable } from "~/types/types-table"

export async function findTarget(id: string) {
  const data = await db.contents.get(id)
  if(!data) return data
  const [comment] = await equipComments([data])
  return comment
}


// 已知某个 comment，加载回复它的评论
export async function findChildren(
  parentId: string,
  lastItemStamp?: number,
) {
  let list: ContentLocalTable[] = []
  if(lastItemStamp) {
    const now = time.getTime()
    let w = ["replyToComment", "oState", "infoType", "createdStamp"]
    let b1 = [parentId, "OK", "COMMENT", lastItemStamp]
    let b2 = [parentId, "OK", "COMMENT", now]
    let q = db.contents.where(w).between(b1, b2, false, true)
    list = await q.sortBy("createdStamp")
  }
  else {
    let w: Partial<ContentLocalTable> = {
      replyToComment: parentId,
      oState: "OK",
      infoType: "COMMENT",
    }
    let q = db.contents.where(w)
    list = await q.sortBy("createdStamp")
  }

  list.splice(9)
  const comments = await equipComments(list)
  return comments
}


/**
 * 获取该评论的加权分数
 * @param c 评论的存储结构
 */
function _getScore(c: ContentLocalTable) {
  const commentNum = c.levelOneAndTwo ?? 0
  const reactionNum = c.emojiData.total
  const score = (5 * commentNum) + (3 * reactionNum)
  return score
}

/**
 * 找出最热门的那个子评论
 * 虽然最多返回一个评论，但仍然用 Array 包裹
 * @param parentId 寻找该 id 的最热门子评论
 */
export async function findHottest(
  parentId: string
) {
  const w: Partial<ContentLocalTable> = {
    replyToComment: parentId,
    oState: "OK",
    infoType: "COMMENT",
  }
  const q = db.contents.where(w)
  const list = await q.sortBy("createdStamp")

  if(list.length < 2) {
    const comments = await equipComments(list)
    return comments
  }
  
  list.sort((v1, v2) => {
    const score1 = _getScore(v1)
    const score2 = _getScore(v2)
    return score2 - score1
  })
  const hottestContent = list[0]
  const comments2 = await equipComments([hottestContent])
  return comments2
}


// 每次溯源 2 个
export async function findParent(
  parentWeWant: string,
  grandparent?: string,
  limitNum: number = 2,
) {

  let all_ids = []
  let ids = [parentWeWant]
  if(grandparent && grandparent !== parentWeWant) ids.push(grandparent)

  let list: ContentLocalTable[] = []

  for(let i=0; i<limitNum; i++) {
    const res = await db.contents.where("_id").anyOf(ids).sortBy("createdStamp")
    if(res.length < 1) break
    list.splice(0, 0, ...res)
    const firstComment = list[0]
    const { replyToComment, parentComment } = firstComment
    if(!replyToComment) break

    all_ids.push(...ids)
    ids = []
    if(!all_ids.includes(replyToComment)) {
      ids.push(replyToComment)
    }
    if(parentComment && parentComment !== replyToComment && !all_ids.includes(parentComment)) {
      ids.push(parentComment)
    }
  }

  const comments = await equipComments(list)
  return comments
}