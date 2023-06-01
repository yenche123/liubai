import { db } from "../../../db";
import type { TcListOption } from "../type";
import type { ContentLocalTable } from "~/types/types-table";
import { equipThreads } from "../../equip/threads";
import { getThreadsByCollection } from "../../collection-controller/collection-controller"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore" 

async function getList(
  opt: TcListOption
) {
  const { 
    spaceId,
    sort = "desc",
    lastItemStamp,
    oState = "OK",
    member,
    limit = 16,
    tagId,
    collectType,
    viewType,
    ids,
    excludeIds,
    stateId,
  } = opt

  if(collectType === "EXPRESS" || collectType === "FAVORITE") {
    const res0 = await getThreadsByCollection(opt as TcListOption)
    return res0
  }

  const isIndex= viewType === "INDEX"
  const isPin = viewType === "PINNED"
  let list: ContentLocalTable[] = []
  const statesNoInIndex = getNoShowInIndexStates(isIndex)

  const filterFunc = (item: ContentLocalTable) => {
    const { 
      tagSearched = [], 
      pinStamp, 
      _id, 
      stateId: stateOnThread,
      infoType
    } = item
    
    if(infoType !== "THREAD") return false
    if(ids && ids.includes(_id)) return true
    if(tagId && !tagSearched.includes(tagId)) return false
    if(stateId && stateId !== stateOnThread) return false
    if(isIndex) {
      if(pinStamp) return false
      if(stateOnThread && statesNoInIndex.includes(stateOnThread)) return false
    }
    if(isPin && !pinStamp) return false
    if(excludeIds && excludeIds.includes(_id)) return false
    if(item.spaceId !== spaceId) return false
    if(item.oState !== oState) return false
    if(member && member !== item.member) return false
    return true
  }

  let key = oState === 'OK' ? "createdStamp" : "updatedStamp"
  if(isPin) key = "pinStamp"

  if(ids?.length) {
    // I. 加载特定 ids
    let tmp = db.contents.where("_id").anyOf(ids)
    tmp = tmp.filter(filterFunc)
    let tmpList = await tmp.toArray()

    // 排序成 ids 的顺序
    if(tmpList.length > 1) {
      ids.forEach(id => {
        let data = tmpList.find(v => v._id === id)
        if(data) list.push(data)
      })
    }
    else {
      list = tmpList
    }

  }
  else if(!lastItemStamp || isPin) {
    // II. 首次加载
    let tmp = db.contents.orderBy(key)
    if(sort === "desc") tmp = tmp.reverse()
    tmp = tmp.filter(filterFunc)
    tmp = tmp.limit(limit)

    // console.time("查询首页")
    list = await tmp.toArray()
    // console.timeEnd("查询首页")
  }
  else {
    // III. 分页加载
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

function getNoShowInIndexStates(isIndex: boolean) {
  if(!isIndex) return []
  const wStore = useWorkspaceStore()
  return wStore.getStatesNoInIndex()
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