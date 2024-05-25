import { db } from "../../../db";
import type { TcListOption } from "../type";
import type { ContentLocalTable } from "~/types/types-table";
import { equipThreads } from "../../equip/threads";
import { getThreadsByCollection } from "../../collection-controller/collection-controller"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore" 
import liuEnv from "~/utils/liu-env";
import time from "~/utils/basic/time";
import cfg from "~/config"
import type { OState } from "~/types/types-basic";

async function getList(
  opt: TcListOption
) {
  const { 
    spaceId,
    sort = "desc",
    lastItemStamp,
    limit = cfg.default_limit_num,
    tagId,
    collectType,
    viewType,
    specific_ids,
    excluded_ids,
    stateId,
  } = opt

  if(collectType === "EXPRESS" || collectType === "FAVORITE") {
    const res0 = await getThreadsByCollection(opt as TcListOption)
    return res0
  }
  
  const isIndex= viewType === "INDEX"
  const isPin = viewType === "PINNED"
  const isTrash = viewType === "TRASH"

  const oState: OState = isTrash ? "REMOVED" : "OK"
  const { REMOVING_DAYS } = liuEnv.getEnv()
  const now = time.getTime()

  let list: ContentLocalTable[] = []
  const statesNoInIndex = getNoShowInIndexStates(isIndex)

  const filterFunc = (item: ContentLocalTable) => {
    const { 
      tagSearched = [], 
      pinStamp, 
      _id, 
      stateId: stateOnThread,
      infoType,
      updatedStamp,
    } = item
    
    if(infoType !== "THREAD") return false
    if(specific_ids && specific_ids.includes(_id)) return true
    if(tagId && !tagSearched.includes(tagId)) return false
    if(stateId && stateId !== stateOnThread) return false
    if(isIndex) {
      if(pinStamp) return false
      if(stateOnThread && statesNoInIndex.includes(stateOnThread)) return false
    }
    if(isPin && !pinStamp) return false
    if(excluded_ids && excluded_ids.includes(_id)) return false
    if(item.spaceId !== spaceId) return false
    if(item.oState !== oState) return false

    // 如果是已被移除的动态
    // REMOVING_DAYS 以外的就不展示
    if(item.oState === "REMOVED") {
      const diff = now - updatedStamp
      if(diff > REMOVING_DAYS * time.DAY) {
        return false
      }
    }

    return true
  }

  let key = oState === 'OK' ? "createdStamp" : "updatedStamp"
  if(isPin) key = "pinStamp"
  else if(isTrash) key = "removedStamp"

  if(specific_ids?.length) {
    // I. 加载特定 ids
    let tmp = db.contents.where("_id").anyOf(specific_ids)
    tmp = tmp.filter(filterFunc)
    let tmpList = await tmp.toArray()

    // 排序成 ids 的顺序
    if(tmpList.length > 1) {
      specific_ids.forEach(id => {
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


  let threads = await equipThreads(list)
  
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
  if(!data) return
  const threads = await equipThreads([data])
  return threads[0]
}


export default {
  getList,
  getData,
}