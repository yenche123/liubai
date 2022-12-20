import { db } from "../../../db";
import type { WhichTagChange } from "./types";
import { getTagIdsParents } from "../index"
import type { ContentLocalTable } from "../../../../types/types-table";
import { findParentOfTag } from "./tag-util";
import { TagView } from "../../../../types/types-atom";
import time from "../../../basic/time";

export async function updateContentForTagAcross(
  whichTagChange: WhichTagChange,
) {
  const { children = [], to_ids = [], from_ids = [] } = whichTagChange

  if(children.length < 1) {
    console.log("children length 为 0")
    return true
  }

  const list = await db.contents.where("tagIds").anyOf(children).distinct().toArray()
  
  const newList: ContentLocalTable[] = []
  let tagChangeRequired = from_ids.length > 0
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    let { tagIds = [] } = v
    if(tagChangeRequired) {
      for(let j=0; j<tagIds.length; j++) {
        const tId = tagIds[j]
        const idx = from_ids.indexOf(tId)
        if(idx < 0) continue
        const newId = to_ids[idx]
        tagIds.splice(j, 1, newId)
      }
    }
    tagIds = [...new Set(tagIds)]
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

/**
 * 更新特定 id 的 content，重新计算它们的 tagSearched
 * @param ids 要这群 id 去检索 contents 的 tagIds 字段
 * @returns 
 */
export async function updateContentForTagRename(
  ids: string[],
  tagList: TagView[]
) {
  const list = await db.contents.where("tagIds").anyOf(ids).distinct().toArray()
  if(list.length < 1) return true
  const newList: ContentLocalTable[] = []
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { tagIds = [] } = v
    let tagSearched: string[] = []
    for(let j=0; j<tagIds.length; j++) {
      const tagId = tagIds[j]
      const tmpList = findParentOfTag(tagId, [], tagList)
      if(tmpList.length < 1) continue
      tagSearched = tagSearched.concat(tmpList)
    }
    tagSearched = [...new Set(tagSearched)]
    v.tagSearched = tagSearched
    newList.push(v)
  }
  const res = await db.contents.bulkPut(newList)
  console.log("updateContentForTagRename 看一下批量修改的结果........")
  console.log(res)
  console.log(" ")
  return true
}


/**
 * 当用户删除标签，但不删除动态时
 * @param idAndChildren 被删除的标签以及其子（孙）标签
 * @param tagList 新的 tagList
 */
export async function updateContentForTagDeleted(
  idAndChildren: string[],
  tagList: TagView[]
) {
  const list = await db.contents.where("tagIds").anyOf(idAndChildren).distinct().toArray()
  if(list.length < 1) return true
  const newList: ContentLocalTable[] = []
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    let { tagIds = [] } = v
    let tagSearched: string[] = []
    for(let j=0; j<tagIds.length; j++) {
      const _tagId = tagIds[j]
      if(idAndChildren.includes(_tagId)) {
        tagIds.splice(j, 1)
        j--
        continue
      }
      const tmpList = findParentOfTag(_tagId, [], tagList)
      if(tmpList.length < 1) continue
      tagSearched = tagSearched.concat(tmpList)
    }
    tagSearched = [...new Set(tagSearched)]
    v.tagIds = tagIds
    v.tagSearched = tagSearched
    newList.push(v)
  }
  const res = await db.contents.bulkPut(newList)
  console.log("updateContentForTagDeleted 看一下批量修改的结果........")
  console.log(res)
  console.log(" ")
  return true
  
}

// 删除 tagSearched 字段里包含 tagId 的动态
export async function deleteContentsForTagDeleted(
  tagId: string,
  tagList: TagView[],
) {
  const list = await db.contents.where("tagSearched").anyOf([tagId]).distinct().toArray()
  if(list.length < 1) return true
  const now = time.getTime()
  const newList: ContentLocalTable[] = []
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { tagIds = [] } = v
    let tagSearched: string[] = []
    for(let j=0; j<tagIds.length; j++) {
      const _tagId = tagIds[j]
      const tmpList = findParentOfTag(_tagId, [], tagList)
      tagSearched = tagSearched.concat(tmpList)
    }
    tagSearched = [...new Set(tagSearched)]
    v.tagSearched = tagSearched
    v.oState = "REMOVED"
    v.updatedStamp = now + i
    newList.push(v)
  }
  const res = await db.contents.bulkPut(newList)
  console.log("deleteContentsForTagDeleted 看一下批量修改的结果........")
  console.log(res)
  console.log(" ")
  return true
}