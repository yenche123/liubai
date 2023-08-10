import { db } from "~/utils/db";
import type { LiuContentType } from "~/types/types-atom"
import checker from "~/utils/other/checker";
import type { 
  ContentLocalTable,
  CollectionLocalTable,
} from "~/types/types-table";
import type { LiuMyContext } from "~/types/types-context";
import time from "~/utils/basic/time";
import ider from "~/utils/basic/ider";

export async function handleEmoji(
  contentId: string,
  forType: LiuContentType,
  encodeStr: string,
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
  await updateContent(res0, encodeStr)
  
  return true
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
  console.log("查看一下 updateContent 的结果......")
  console.log(res1)
  console.log(" ")

  return true
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
  console.log(res2)
  return true
}