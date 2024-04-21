// content-operate 用于综合处理动态或评论的公共逻辑
// 比如 操作 emoji 两者皆有，就会交有 contentOperate 来处理

import { db } from "~/utils/db";
import type { ContentInfoType } from "~/types/types-atom";
import checker from "~/utils/other/checker";
import type {
  CollectionLocalTable,
} from "~/types/types-table";
import type { LiuMyContext } from "~/types";
import time from "~/utils/basic/time";
import ider from "~/utils/basic/ider";
import type { CommentShow, ThreadShow, EmojiData } from "~/types/types-content";
import valTool from "~/utils/basic/val-tool";
import { 
  useCommentStore,
  type CommentStoreSetDataOpt,
 } from "~/hooks/stores/useCommentStore";
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import type { OState_2 } from "~/types/types-basic"
import liuApi from "~/utils/liu-api"


/**
 * 添加或取消 emoji
 * 若 encodeStr 为空，代表取消
 * @param contentId 
 * @param forType 
 * @param encodeStr 
 * @param thread 当 forType 为 THREAD 时必传，为了通知其他组件
 * @param comment 当 forType 为 COMMENT 时必传，为了通知其他组件
 */
export async function toEmoji(
  contentId: string,
  forType: ContentInfoType,
  encodeStr: string,
  thread?: ThreadShow,
  comment?: CommentShow,
) {

  // 0. 获取 userId memberId spaceType spaceId
  const authData = checker.getMyContext()
  if(!authData) return false

  // 1. 先查看 contentId 是否存在
  const res0 = await db.contents.get(contentId)
  if(!res0 || res0.oState !== "OK") {
    console.log("contentId 不存在，或者已被删除........")
    console.log(res0)
    console.log(" ")
    return false
  }

  // 2. 检查 collection 是否已存在
  const w1: Partial<CollectionLocalTable> = {
    user: authData.userId,
    infoType: "EXPRESS",
    forType,
    content_id: contentId,
  }
  const res1 = await db.collections.get(w1)

  // 3. 操作 collection 和 emojiData
  const emojiData = res0.emojiData
  if(res1) {
    // 若存在 collection，判断意图

    if(res1.oState === "OK") {
      // 已有 emoji 的情况

      if(res1.emoji === encodeStr) return true

      // 先把已有的删除
      console.log("先把 emojiData 里原先的 emoji 删除")
      if(res1.emoji) updateEmojiData(emojiData, res1.emoji, -1)

      if(!encodeStr) {
        console.log("期望是取消 emoji，所以把这行 row 置为 CANCELED")
        await updateCollection(res1._id, "", "CANCELED")
      }
      else {
        console.log("期望是新增 emoji，所以新增 emojiData 里的 encodeStr")
        updateEmojiData(emojiData, encodeStr, 1)
        console.log("并把这行 row 改为 OK")
        await updateCollection(res1._id, encodeStr, "OK")
      }
    }
    else {
      // 之前的 emoji 是取消的情况
      console.log("之前的 emoji 是取消的情况")

      // 新的动作也是取消 emoji，直接 return
      if(!encodeStr) return true

      console.log("期望是新增 emoji，所以新增 emojiData 里的 encodeStr")
      // 新的动作是新增 emoji
      updateEmojiData(emojiData, encodeStr, 1)

      console.log("并把这行 row 改为 OK")
      await updateCollection(res1._id, encodeStr, "OK")
    }
  }
  else {
    console.log("没有任何关于这则内容的 emoji.........")
    if(!encodeStr) return true
    
    console.log("期望是新增 emoji，所以新增 emojiData 里的 encodeStr")
    // 新的动作是新增 emoji
    updateEmojiData(emojiData, encodeStr, 1)

    console.log("因为没有 collection，所以去新增")
    await addCollection(contentId, forType, encodeStr, authData)
  }

  // 4. 修改 contentId 上的 emojiData
  await updateContent(res0._id, emojiData)

  // 5. 震动
  liuApi.vibrate([50])

  // 6. 通知其他组件
  if(forType === "COMMENT" && comment) {
    notifyOtherComments(comment, encodeStr, emojiData)
  }
  else if(forType === "THREAD" && thread) {
    notifyOtherThreads(thread, encodeStr, emojiData)
  }
  
  return true
}

function notifyOtherComments(
  comment: CommentShow,
  encodeStr: string,
  newEmojiData: EmojiData,
) {
  const now = time.getTime()
  const newComment = valTool.copyObject(comment)
  newComment.emojiData = newEmojiData
  newComment.myEmoji = encodeStr
  newComment.myEmojiStamp = now

  const cStore = useCommentStore()
  const data: CommentStoreSetDataOpt = {
    changeType: "operate",
    commentId: newComment._id,
    commentShow: newComment,
    parentThread: newComment.parentThread,
    parentComment: newComment.parentComment,
    replyToComment: newComment.replyToComment,
  }
  cStore.setData(data)
}


function notifyOtherThreads(
  thread: ThreadShow,
  encodeStr: string,
  newEmojiData: EmojiData,
) {
  const now = time.getTime()
  const newThread = valTool.copyObject(thread)
  newThread.emojiData = newEmojiData
  newThread.myEmoji = encodeStr
  newThread.myEmojiStamp = now

  const tStore = useThreadShowStore()
  tStore.setUpdatedThreadShows([newThread], "emoji")
}


function updateEmojiData(
  emojiData: EmojiData,
  encodeStr: string,
  delta: number = 1,
) {
  emojiData.total += delta
  if(emojiData.total < 0) emojiData.total = 0
  const emojiSystem = emojiData.system
  const theEmoji = emojiSystem.find(v => v.encodeStr === encodeStr)
  if(theEmoji) {
    theEmoji.num += delta
    if(theEmoji.num < 0) theEmoji.num = 0
  }
  else if(delta > 0) {
    emojiSystem.push({ num: delta, encodeStr })
  }
}

async function updateContent(
  id: string,
  emojiData: EmojiData
) {
  const res1 = await db.contents.update(id, { emojiData })
  return emojiData
}

async function updateCollection(
  collectionId: string,
  encodeStr: string,
  oState: OState_2,
) {
  const now = time.getTime()
  const w1: Partial<CollectionLocalTable> = {
    oState,
    emoji: encodeStr,
    updatedStamp: now,
  }
  const res1 = await db.collections.update(collectionId, w1)
  console.log("updateCollection......")
  console.log(res1)
  return true
}

async function addCollection(
  contentId: string,
  forType: ContentInfoType,
  encodeStr: string,
  authData: LiuMyContext,
) {
  const b1 = time.getBasicStampWhileAdding()
  const newId = ider.createCollectId()
  const w: CollectionLocalTable = {
    ...b1,
    _id: newId,
    first_id: newId,
    oState: "OK",
    user: authData.userId,
    member: authData.memberId,
    infoType: "EXPRESS",
    forType,
    spaceId: authData.spaceId,
    spaceType: authData.spaceType,
    content_id: contentId,
    emoji: encodeStr,
  }
  const res = await db.collections.add(w)
  return true
}