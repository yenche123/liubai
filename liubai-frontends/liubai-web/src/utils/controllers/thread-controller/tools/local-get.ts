import { db } from "../../../db";
import type { TcListOption } from "../type";
import type { ContentLocalTable } from "../../../../types/types-table";
import { equipThreads } from "../../equip-content/equip-content";
import { getThreadsByCollectionOrEmoji } from "../../collection-controller/collection-controller"

async function getList(
  opt?: TcListOption
) {
  const { 
    workspace = "ME",
    sort = "desc",
    lastItemStamp,
    oState = "OK",
    member,
    limit = 16,
    tagId,
    collectType,
  } = opt ?? {}

  if(collectType === "EXPRESS" || collectType === "FAVORITE") {
    const res0 = await getThreadsByCollectionOrEmoji(opt as TcListOption)
    return res0
  }

  let list: ContentLocalTable[] = []

  const filterFunc = (item: ContentLocalTable) => {
    const { tagSearched = [] } = item
    if(tagId && !tagSearched.includes(tagId)) return false
    if(item.workspace === workspace && item.oState === oState) {
      if(!member) return true
      if(member === item.member) return true
    }
    return false
  }

  // 查询首页
  let key = oState === 'OK' ? "createdStamp" : "updatedStamp"
  if(!lastItemStamp) {
    let tmp = db.contents.orderBy(key)
    if(sort === "desc") tmp = tmp.reverse()
    tmp = tmp.filter(filterFunc)
    tmp = tmp.limit(limit)

    // console.time("查询首页")
    list = await tmp.toArray()
    // console.timeEnd("查询首页")
  }
  else {
    // 查询首页以后
    let w = db.contents.where(key)
    let tmp = sort === "desc" ? w.below(lastItemStamp) : w.above(lastItemStamp)
    if(sort === "desc") tmp = tmp.reverse()
    tmp = tmp.filter(filterFunc)
    tmp = tmp.limit(limit)
    // console.time("查询非首页")
    list = await tmp.toArray()
    // console.timeEnd("查询非首页")
  }

  // console.log(" ")

  // console.time("equipThreads")
  let threads = await equipThreads(list)
  // console.timeEnd("equipThreads")
  // console.log(" ")
  
  return threads
}

async function getData(
  id: string
) {
  const data = await db.contents.get(id)
  if(!data) return data
  const threads = await equipThreads([data])
  return threads[0]
}


export default {
  getList,
  getData,
}