import type { SortWay, OState } from "../../../../types/types-basic";
import time from "../../../basic/time";
import { db } from "../../../db";
import type { TcListOption } from "../type";
import { fastForward } from "../../tools/util-db"
import { ContentLocalTable } from "../../../../types/types-table";

async function getList(
  opt?: TcListOption
) {
  const { 
    workspace = "ME", 
    sort = "desc",
    lastCreatedStamp,
    oState = "OK",
    member
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
    tmp = tmp.limit(10)
    list = await tmp.toArray()
  }
  else {
    // 查询首页以后
    let w = db.contents.where("createdStamp")
    let tmp = sort === "desc" ? w.below(lastCreatedStamp) : w.above(lastCreatedStamp)
    if(sort === "desc") tmp = tmp.reverse()
    tmp = tmp.filter(filterFunc)
    tmp = tmp.limit(10)
    list = await tmp.toArray()
  }
  
  return list
}

function getData(
  id: string
) {

}


export default {
  getList,
  getData,
}