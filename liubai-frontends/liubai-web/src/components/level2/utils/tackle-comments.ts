import type { CommentShow } from "~/types/types-content";
import { CloudMerger } from "~/utils/cloud/CloudMerger";
import liuEnv from "~/utils/liu-env";
import liuUtil from "~/utils/liu-util";
import { type ValueComment, getValuedComments } from "~/utils/other/comment-related";
import type { SyncGet_CommentList_D } from "~/types/cloud/sync-get/types"
import type { 
  LoadByCommentOpt,
} from "~/utils/controllers/comment-controller/tools/types"
import usefulTool from "~/utils/basic/useful-tool";
import commentController from "~/utils/controllers/comment-controller/comment-controller";

export async function fetchChildrenComments(
  newList: CommentShow[],
  networkLevel: number,
) {

  const valueComments = getValuedComments(newList)
  if(valueComments.length < 1) return []

  // 1. delete items where their index is
  // equal to or more than 3
  const len = valueComments.length
  if(len > 3) {
    valueComments.splice(3, len - 3)
  }

  // 2. check out if get to sync
  const canSync = liuEnv.canISync()
  if(!canSync || networkLevel < 1) {
    return valueComments
  }

  // 3. get ids for querying cloud
  const ids: string[] = []
  valueComments.forEach(v => {
    const res3_1 = liuUtil.check.hasEverSynced(v)
    if(!res3_1) return
    const res3_2 = liuUtil.check.isLocalContent(v.storageState)
    if(res3_2) return
    ids.push(v._id)
  })

  // 4. to query
  const len4 = ids.length
  const promises: Promise<any>[] = []
  for(let i=0; i<ids.length; i++) {
    const _id = ids[i]
    const param4: SyncGet_CommentList_D = {
      taskType: "comment_list",
      loadType: "find_hottest",
      commentId: _id,
    }
    const delay = i === (len4 - 1) ? 0 : undefined
    const pro = CloudMerger.request(param4, { delay })
    promises.push(pro)
  }

  // 5. wait promises
  const res5 = await Promise.all(promises)
  return valueComments
}

export async function addChildrenIntoValueComments(
  comments: CommentShow[],
  valueComments: ValueComment[],
) {
  const _addNewComment = (prevId: string, newComment: CommentShow) => {
    newComment.prevIReplied = true

    // 过滤: 若已存在，则忽略
    const _tmpList = [newComment]
    usefulTool.filterDuplicated(comments, _tmpList)
    if(_tmpList.length < 1) return

    for(let i=0; i<comments.length; i++) {
      const v = comments[i]
      if(v._id === prevId) {
        // console.warn(`add new comment at ${i + 1}`)
        // console.log(newComment)
        // console.log(" ")

        v.nextRepliedMe = true
        comments.splice(i + 1, 0, newComment)
        break
      }
    }
  }

  const _toFind = async (prevId: string) => {
    const opt: LoadByCommentOpt = {
      commentId: prevId,
      loadType: "find_hottest",
    }
    const newComments = await commentController.loadByComment(opt)
    return newComments[0]
  }

  let num = 0
  for(let i=0; i<valueComments.length; i++) {
    const v = valueComments[i]
    const p1 = v._id
    const c1 = await _toFind(p1)
    if(!c1) continue
    _addNewComment(p1, c1)
    num++

    if(c1.commentNum > 0) {
      const p2 = c1._id
      const c2 = await _toFind(p2)
      if(!c2) continue
      _addNewComment(p2, c2)
      num++
    }

    if(num >= 4) break
  }
  
}



