import type { SortWay, OState } from "../../../../types/types-basic";
import time from "../../../basic/time";
import { db } from "../../../db";
import type { TcListOption } from "../type";
import { ContentLocalTable } from "../../../../types/types-table";
import { equipThreads } from "../../equip-content/equip-content";

async function getList(
  opt?: TcListOption
) {
  const { 
    workspace = "ME", 
    sort = "desc",
    lastCreatedStamp,
    oState = "OK",
    member,
    limit = 16
  } = opt ?? {}

  let list: ContentLocalTable[] = []

  const filterFunc = (item: ContentLocalTable) => {
    if(item.workspace === workspace && item.oState === oState) {
      if(!member) return true
      if(member === item.member) return true
    }
    return false
  }

  // 查询首页
  if(!lastCreatedStamp) {
    let tmp = db.contents.orderBy("createdStamp")
    if(sort === "desc") tmp = tmp.reverse()
    tmp = tmp.filter(filterFunc)
    tmp = tmp.limit(limit)

    // console.time("查询首页")
    list = await tmp.toArray()
    // console.timeEnd("查询首页")
  }
  else {
    // 查询首页以后
    let w = db.contents.where("createdStamp")
    let tmp = sort === "desc" ? w.below(lastCreatedStamp) : w.above(lastCreatedStamp)
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

function getData(
  id: string
) {

}


export default {
  getList,
  getData,
}