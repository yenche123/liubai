import type { SortWay, OState } from "../../../../types/types-basic";
import time from "../../../basic/time";
import { db } from "../../../db";
import type { TcListOption } from "../type";
import { fastForward } from "../../tools/util-db"

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

  const now = time.getTime()
  const MIN = 1000 * 60

  let w = "workspace+infoType+oState"
  let b1: any[] = [workspace, "THREAD", oState]
  let b2: any[] = [workspace, "THREAD", oState]
  let includeLower = true
  let includeUpper = true

  if(member) {
    w += "+member"
    b1.push(member)
    b2.push(member)
  }

  if(lastCreatedStamp) {
    w += "+createdStamp"
    if(sort === "desc") {
      b1.push(0)
      b2.push(lastCreatedStamp)
      includeLower = true
      includeUpper = false
    }
    else {
      b1.push(lastCreatedStamp)
      b2.push(now + MIN)
      includeLower = false
      includeUpper = true
    }
  }

  w = `[${w}]`
  let tmp = db.contents.where(w).between(b1, b2, includeLower, includeUpper)
  tmp = tmp.limit(10)
  if(sort === "desc") tmp = tmp.reverse()

  console.time("【重要指标】local-get")
  const res = await tmp.sortBy("createdStamp")
  console.timeEnd("【重要指标】local-get")

  console.log(" ")

  return res
}

function getData(
  id: string
) {

}


export default {
  getList,
  getData,
}