import type { ThreadShow } from "~/types/types-content";
import type { CollectionLocalTable, ContentLocalTable } from "~/types/types-table";
import type { OState } from "~/types/types-basic";
import ider from "~/utils/basic/ider";
import time from "~/utils/basic/time";
import { db } from "~/utils/db";
import type { ContentConfig } from "~/types/other/types-custom"

async function collect(
  thread: ThreadShow, 
  memberId: string, 
  userId: string
) {
  let newState = thread.myFavorite
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
  if(newState && !res0) {
    // add 数据
    const data0: CollectionLocalTable = {
      _id: ider.createCollectId(),
      insertedStamp: stamp ?? now1,
      updatedStamp: stamp ?? now1,
      user: userId,
      oState: "OK",
      member: memberId,
      infoType: "FAVORITE",
      forType: "THREAD",
      spaceId: thread.spaceId,
      spaceType: thread.spaceType,
      content_id: thread._id,
    }
    const res1 = await db.collections.add(data0)
    // console.log("add collection 的结果.......")
    // console.log(res1)
    // console.log(" ")
  }
  else if(newState && res0?.oState === "CANCELED") {
    // 目标状态: 已收藏、逻辑数据: 已取消 ——> 更新数据
    const data0: Partial<CollectionLocalTable> = { oState: "OK", updatedStamp: stamp ?? now1 }
    const res1 = await db.collections.update(res0._id, data0)
    // console.log("update collection to OK 的结果.......")
    // console.log(res1)
    // console.log(" ")
  }
  else if(!newState && res0?.oState === "OK") {
    // update 或者 delete
    if(stamp) {
      const data0: Partial<CollectionLocalTable> = { oState: "CANCELED", updatedStamp: stamp }
      const res1 = await db.collections.update(res0._id, data0)
      // console.log("update collection to CANCELED 的结果.......")
      // console.log(res1)
      // console.log(" ")
    }
    else {
      const res1 = await db.collections.delete(res0._id)
      // console.log("delete collection 的结果.......")
      // console.log(res1)
      // console.log(" ")
    }
  }

  return true
}

/** 收藏 */
async function pin(
  thread: ThreadShow, 
  memberId: string, 
  userId: string
) {
  const now1 = time.getTime()
  const newData: Partial<ContentLocalTable> = {
    pinStamp: thread.pinStamp,
    updatedStamp: now1,
  } 
  const res = await db.contents.update(thread._id, newData)
  return true
}


/** 向 content 设置新的 "什么时候" 和 "提醒我" */
async function editWhenRemind(
  thread: ThreadShow, 
  memberId: string, 
  userId: string
) {
  const now1 = time.getTime()
  const newData: Partial<ContentLocalTable> = {
    whenStamp: thread.whenStamp,
    remindStamp: thread.remindStamp,
    remindMe: thread.remindMe,
    updatedStamp: now1
  }
  const res = await db.contents.update(thread._id, newData)
  console.log("db-opt 的结果: ")
  console.log(res)
  console.log(" ")

  return true
}

/** 向 content 设置新的 oState */
async function setNewOState(
  id: string,
  oState: OState,
) {
  const now1 = time.getTime()
  const newData: Partial<ContentLocalTable> = {
    oState,
    updatedStamp: now1
  }
  const res = await db.contents.update(id, newData)
  console.log(`db-opt setNewOState ${oState} 的结果: `)
  console.log(res)
  console.log(" ")

  return true
}


async function deleteForever(
  id: string,
) {
  const now1 = time.getTime()
  const newData: Partial<ContentLocalTable> = {
    oState: "DELETED",
    updatedStamp: now1,
    title: "",
    liuDesc: [],
    images: [],
    files: [],
    tagIds: [],
    tagSearched: [],
  }
  const res = await db.contents.update(id, newData)
  console.log(`db-opt deleteForever 的结果: `)
  console.log(res)
  console.log(" ")

  return true
}

async function setContentConfig(
  id: string,
  contentConfig?: ContentConfig
) {
  const now1 = time.getTime()
  const newData: Partial<ContentLocalTable> = {
    updatedStamp: now1,
    config: contentConfig,
  } 
  const res = await db.contents.update(id, newData)
  console.log(`db-opt setContentConfig 的结果: `)
  console.log(res)
  console.log(" ")

  return true
}

async function countPin() {
  const filterFunc = (item: ContentLocalTable) => {
    if(item.oState !== "OK") return false
    if(item.infoType !== "THREAD") return false
    return true
  }
  const res = await db.contents.where("pinStamp").above(0).filter(filterFunc).count()
  // console.log("countPin res: ", res)
  return res
}

async function setStateId(
  id: string,
  newStateId?: string
) {
  const now1 = time.getTime()
  const newData: Partial<ContentLocalTable> = {
    updatedStamp: now1,
    stateId: newStateId,
  }
  // console.log("db-op setStateId newData: ")
  // console.log(newData)
  // console.log(" ")
  const res = await db.contents.update(id, newData)
  // console.log("db.contents.update res: ")
  // console.log(res)
  // console.log(" ")
  return true
}

export default {
  collect,
  pin,
  editWhenRemind,
  setNewOState,
  deleteForever,
  setContentConfig,
  countPin,
  setStateId,
}