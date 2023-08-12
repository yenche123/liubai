import { db } from "~/utils/db";
import type { LiuContentType } from "~/types/types-atom";
import checker from "~/utils/other/checker";
import type { 
  ContentLocalTable,
  CollectionLocalTable,
} from "~/types/types-table";
import type { LiuMyContext } from "~/types/types-context";
import time from "~/utils/basic/time";
import ider from "~/utils/basic/ider";
import type { CommentShow, ThreadShow, EmojiData } from "~/types/types-content";
import valTool from "~/utils/basic/val-tool";
import { 
  useCommentStore,
  type CommentStoreSetDataOpt,
 } from "~/hooks/stores/useCommentStore";
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";

export async function handleEmoji(
  contentId: string,
  forType: LiuContentType,
  encodeStr: string,
  thread?: ThreadShow,
  comment?: CommentShow,
) {

  // 0. 获取 userId memberId spaceType spaceId
  const authData = checker.getMyContext()
  if(!authData) return

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

  // 3. 若已存在 collection 去修改，反之去新增
  if(res1) {
    await updateEmoji(res1._id, encodeStr)
  }
  else {
    await addEmoji(contentId, forType, encodeStr, authData)
  }

  // 4. 修改 contentId 上的 emojiData
  const newEmojiData = await updateContent(res0, encodeStr)

  // 5. 通知其他组件
  if(forType === "COMMENT" && comment) {
    notifyOtherComments(comment, encodeStr, newEmojiData)
  }
  else if(forType === "THREAD" && thread) {
    notifyOtherThreads(thread, encodeStr, newEmojiData)
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

async function updateContent(
  res0: ContentLocalTable,
  encodeStr: string,
) {
  const { emojiData } = res0
  emojiData.total++
  const emojiSystem = emojiData.system
  const theEmoji = emojiSystem.find(v => v.encodeStr === encodeStr)
  if(theEmoji) {
    theEmoji.num++
  }
  else {
    emojiSystem.push({ num: 1, encodeStr })
  }
  const res1 = await db.contents.update(res0._id, { emojiData })
  return emojiData
}

async function updateEmoji(
  collectionId: string,
  encodeStr: string,
) {
  const now = time.getTime()
  const w1: Partial<CollectionLocalTable> = {
    oState: "OK",
    emoji: encodeStr,
    updatedStamp: now,
  }
  const res1 = await db.collections.update(collectionId, w1)
  console.log("updateEmoji......")
  console.log(res1)
  return true
}

async function addEmoji(
  contentId: string,
  forType: LiuContentType,
  encodeStr: string,
  authData: LiuMyContext,
) {
  const now = time.getTime()
  const newId = ider.createCollectId()
  const w2: CollectionLocalTable = {
    _id: newId,
    insertedStamp: now,
    updatedStamp: now,
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
  const res2 = await db.collections.add(w2)
  return true
}