import type { ContentLocalTable } from "~/types/types-table"
import type { GetDataOpt } from "./types"
import { db } from "~/utils/db"


type ContentsCollection = ReturnType<typeof db.contents.orderBy>

export async function getData(opt: GetDataOpt) {

  const {
    lastItemStamp,
    spaceId,
    limit,
  } = opt


  const filterFunc = (item: ContentLocalTable) => {
    if(item.oState !== "OK") return false
    if(item.spaceId !== spaceId) return false
    return true
  }

  let list: ContentLocalTable[] = []
  let searchKey = "createdStamp"


  let q: ContentsCollection
  if(!lastItemStamp) {
    // I. 首次加载
    q = db.contents.orderBy(searchKey)
  }
  else {
    // II. 分页加载
    let w = db.contents.where(searchKey)
    q = w.below(lastItemStamp)
  }

  q = q.reverse()
  q = q.filter(filterFunc)
  q = q.limit(limit)
  list = await q.toArray()

  return list
}