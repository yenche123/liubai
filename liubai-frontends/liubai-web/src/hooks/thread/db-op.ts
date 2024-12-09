import type { ThreadShow } from "~/types/types-content";
import type { CollectionLocalTable, ContentLocalTable } from "~/types/types-table";
import ider from "~/utils/basic/ider";
import time from "~/utils/basic/time";
import { db } from "~/utils/db";
import type { ContentConfig } from "~/types/other/types-custom"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud";
import { type LiuUploadTask } from "~/types/types-atom";
import liuUtil from "~/utils/liu-util";

async function collect(
  thread: ThreadShow, 
  memberId: string, 
  userId: string,
  isUndo: boolean = false,
) {
  let newFavorite = thread.myFavorite
  let stamp = thread.myFavoriteStamp
  
  // 操作 collection
  const g1: Partial<CollectionLocalTable> = {
    user: userId,
    infoType: "FAVORITE",
    forType: "THREAD",
    content_id: thread._id,
  }
  const res0 = await db.collections.get(g1)

  // console.log("查询 collection 的结果: ")
  // console.log(res0)

  const now1 = time.getTime()
  const newStamp = stamp ?? now1
  let collection_id = ""

  if(newFavorite && !res0) {
    // add 数据
    const newId = ider.createCollectId()
    const data0: CollectionLocalTable = {
      _id: newId,
      first_id: newId,
      insertedStamp: newStamp,
      updatedStamp: newStamp,
      user: userId,
      oState: "OK",
      member: memberId,
      infoType: "FAVORITE",
      forType: "THREAD",
      spaceId: thread.spaceId,
      spaceType: thread.spaceType,
      content_id: thread._id,
      operateStamp: newStamp,
      sortStamp: newStamp,
    }
    const res1 = await db.collections.add(data0)
    collection_id = newId
  }
  else if(newFavorite && res0?.oState === "CANCELED") {
    // 将 “已取消” 改成 “正常” 收藏的状态
    const data0: Partial<CollectionLocalTable> = { 
      oState: "OK", 
      updatedStamp: now1,
      sortStamp: newStamp,
      operateStamp: now1,
    }
    const res1 = await db.collections.update(res0._id, data0)
    collection_id = res0._id
  }
  else if(!newFavorite && res0?.oState === "OK") {
    // update
    const data0: Partial<CollectionLocalTable> = { 
      oState: "CANCELED", 
      updatedStamp: now1,
      sortStamp: newStamp,
      operateStamp: now1,
    }
    const res1 = await db.collections.update(res0._id, data0)
    collection_id = res0._id
  }

  if(collection_id) {
    LocalToCloud.addTask({
      uploadTask: isUndo ? "undo_collection-favorite" : "collection-favorite",
      target_id: collection_id,
      operateStamp: now1,
    })
  }

  return true
}

/** 收藏 */
async function pin(
  thread: ThreadShow, 
  memberId: string, 
  userId: string,
  isUndo: boolean = false,
) {
  const id = thread._id
  const oldCfg = await getOldCfg(id)

  const now1 = time.getTime()
  const newCfg = getNewCfg("lastOperatePin", now1, oldCfg)
  const newData: Partial<ContentLocalTable> = {
    pinStamp: thread.pinStamp,
    updatedStamp: now1,
    config: newCfg,
  }
  const res = await db.contents.update(id, newData)

  LocalToCloud.addTask({
    uploadTask: isUndo ? "undo_thread-pin" : "thread-pin",
    target_id: id,
    operateStamp: now1,
  })

  return true
}


/** 向 content 设置新的 "什么时候" 和 "提醒我" */
async function editWhenRemind(
  thread: ThreadShow, 
  memberId: string, 
  userId: string,
  isUndo: boolean = false,
) {
  const id = thread._id
  const oldCfg = await getOldCfg(id)

  const now1 = time.getTime()
  const newCfg = getNewCfg("lastOperateWhenRemind", now1, oldCfg)
  const newData: Partial<ContentLocalTable> = {
    calendarStamp: thread.calendarStamp,
    whenStamp: thread.whenStamp,
    remindStamp: thread.remindStamp,
    remindMe: thread.remindMe,
    updatedStamp: now1,
    config: newCfg,
  }
  const res = await db.contents.update(thread._id, newData)
  
  LocalToCloud.addTask({
    uploadTask: isUndo ? "undo_thread-when-remind" : "thread-when-remind",
    target_id: id,
    operateStamp: now1,
  })

  return true
}

/** 向 content 设置新的 oState */
async function setOState(
  thread: ThreadShow, 
  uploadTask: LiuUploadTask,
) {
  const id = thread._id
  const now1 = time.getTime()
  const oldCfg = await getOldCfg(id)
  const newCfg = getNewCfg("lastOStateStamp", now1, oldCfg)

  const newData: Partial<ContentLocalTable> = {
    removedStamp: thread.removedStamp,
    oState: thread.oState,
    updatedStamp: now1,
    config: newCfg,
  }
  const res = await db.contents.update(id, newData)

  LocalToCloud.addTask({
    uploadTask,
    target_id: id,
    operateStamp: now1,
  })

  return true
}


async function deleteForever(
  id: string,
) {
  const oldCfg = await getOldCfg(id)

  const now1 = time.getTime()
  const newCfg = getNewCfg("lastOStateStamp", now1, oldCfg)
  const newData: Partial<ContentLocalTable> = {
    oState: "DELETED",
    updatedStamp: now1,
    title: "",
    liuDesc: [],
    images: [],
    files: [],
    tagIds: [],
    tagSearched: [],
    search_title: "",
    search_other: "",
    config: newCfg,
  }
  const res = await db.contents.update(id, newData)

  LocalToCloud.addTask({
    uploadTask: "thread-delete_forever",
    target_id: id,
    operateStamp: now1,
  })

  return true
}

async function setShowCountdown(
  id: string,
  newShowCountdown: boolean,
  isUndo: boolean = false,
) {
  const oldCfg = await getOldCfg(id)

  const now1 = time.getTime()
  const newCfg = getNewCfg("lastToggleCountdown", now1, oldCfg)
  newCfg.showCountdown = newShowCountdown
  const res = await db.contents.update(id, { config: newCfg })

  LocalToCloud.addTask({
    uploadTask: isUndo ? "undo_thread-hourglass" : "thread-hourglass",
    target_id: id,
    operateStamp: now1,
  })
  
  return true
}

async function setTags(
  id: string,
  tagIds?: string[],
  tagSearched?: string[],
) {
  const oldCfg = await getOldCfg(id)

  const now1 = time.getTime()
  const newCfg = getNewCfg("lastOperateTag", now1, oldCfg)
  const newData: Partial<ContentLocalTable> = {
    updatedStamp: now1,
    tagIds,
    tagSearched,
    config: newCfg,
  } 
  const res = await db.contents.update(id, newData)

  LocalToCloud.addTask({
    uploadTask: "thread-tag",
    target_id: id,
    operateStamp: now1,
  })

  return true
}

async function countPin(
  spaceId: string,
) {
  const filterFunc = (item: ContentLocalTable) => {
    if(item.oState !== "OK") return false
    if(item.infoType !== "THREAD") return false
    if(item.spaceId !== spaceId) return false
    return true
  }
  const res = await db.contents.where("pinStamp").above(0).filter(filterFunc).count()
  // console.log("countPin res: ", res)
  return res
}

async function setStateId(
  id: string,
  newStateId?: string,
  newStateStamp?: number
) {
  const oldCfg = await getOldCfg(id)
  const now1 = time.getTime()
  const newCfg = getNewCfg("lastOperateStateId", now1, oldCfg)
  const newData: Partial<ContentLocalTable> = {
    updatedStamp: now1,
    stateId: newStateId,
    stateStamp: newStateStamp,
    config: newCfg,
  }
  const res = await db.contents.update(id, newData)
  return now1
}


async function getOldCfg(id: string) {
  const res = await db.contents.get(id)
  if(!res) return
  return res.config
}

function getNewCfg<T extends keyof ContentConfig>(
  key: T,
  val: ContentConfig[T],
  oldCfg?: ContentConfig,
) {
  if(!oldCfg) oldCfg = {}
  oldCfg[key] = val
  return oldCfg
}

export default {
  collect,
  pin,
  editWhenRemind,
  setOState,
  deleteForever,
  setShowCountdown,
  setTags,
  countPin,
  setStateId,
}