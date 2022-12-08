import { db } from "../../../db";
import type { WhichTagChange } from "./types";
import type { DraftLocalTable } from "../../../../types/types-table";

export async function updateDraftForTagAcross(
  whichTagChange: WhichTagChange,
) {
  const { children = [], to_ids = [], from_ids = [] } = whichTagChange
  let tagChangeRequired = from_ids.length > 0
  if(!tagChangeRequired || children.length < 1) {
    console.log("没有发生合并，直接 return ture 啦！")
    return true
  }

  const list = await db.drafts.where("tagIds").anyOf(children).distinct().toArray()
  const newList: DraftLocalTable[] = []
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    let { tagIds = [] } = v
    for(let j=0; j<tagIds.length; j++) {
      const tId = tagIds[j]
      const idx = from_ids.indexOf(tId)
      if(idx < 0) continue
      const newId = to_ids[idx]
      tagIds.splice(j, 1, newId)
    }
    tagIds = [...new Set(tagIds)]
    v.tagIds = tagIds
    newList.push(v)
  }

  if(newList.length < 1) return true

  console.log("因为 tags 的跨级移动，准备去修改 drafts")
  console.log(newList)
  console.log(" ")

  const res = await db.drafts.bulkPut(newList)
  console.log("draft-util 看一下批量修改的结果........")
  console.log(res)
  console.log(" ")
  
  return true
}