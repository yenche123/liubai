import { db } from "../../../db";
import type { WhichTagChange } from "./types";
import { getTagIdsParents } from "../index"
import type { ContentLocalTable } from "../../../../types/types-table";

export async function updateContentForTagAcross(
  whichTagChange: WhichTagChange,
) {
  const { children = [], to_ids = [], from_ids = [] } = whichTagChange

  if(children.length < 1) {
    console.log("children length 为 0")
    return true
  }

  const list = await db.contents.where("tagIds").anyOf(children).toArray()

  console.log("看一下 contents 找到的 list: ", list)
  
  const newList: ContentLocalTable[] = []
  let tagChangeRequired = from_ids.length > 0
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { tagIds = [] } = v
    if(tagChangeRequired) {
      for(let j=0; j<tagIds.length; j++) {
        const tId = tagIds[j]
        const idx = from_ids.indexOf(tId)
        if(idx < 0) continue
        const newId = to_ids[idx]
        tagIds.splice(j, 1, newId)
      }
    }
    const newTagSearched = getTagIdsParents(tagIds)
    v.tagIds = tagIds
    v.tagSearched = newTagSearched
    newList.push(v)
  }

  if(newList.length < 1) return true

  console.log("因为 tags 的跨级移动，准备去修改 contents")
  console.log(newList)
  console.log(" ")

  const res = await db.contents.bulkPut(newList)
  console.log("content-util 看一下批量修改的结果........")
  console.log(res)
  console.log(" ")
  
  return true
}