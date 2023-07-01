
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
    let w = ["replyToComment", "oState", "createdStamp"]
    let b1 = [parentId, "OK", lastItemStamp]
    let b2 = [parentId, "OK", now]
    let q = db.contents.where(w).between(b1, b2, false, true)
    list = await q.sortBy("createdStamp")
  }
  else {
    let w = {
      replyToComment: parentId,
      oState: "OK",
    }
    let q = db.contents.where(w)
    list = await q.sortBy("createdStamp")
  }

  list.splice(9)
  const comments = await equipComments(list)
  return comments
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