import type { TagView } from "../../../../types/types-atom";
import { TagShow } from "../../../../types/types-content";
import ider from "../../../basic/ider";
import time from "../../../basic/time";


/**
 * 寻找某个片段文字（忽略大小写）是否在该级的 tagViews 中存在
 * @param val 某段 tag，即 / 和 / 之间的片段文字
 * @param tagList 只检测该 tagList 第一级的 TagView
 * @returns 返回有找到的索引，若为则返回 -1
 */
export function findIndexInThisTagList(val: string, tagList: TagView[]) {
  val = val.toLowerCase()
  for(let i=0; i<tagList.length; i++) {
    const v = tagList[i]
    if(v.oState === 'REMOVED') continue
    const text = v.text.toLowerCase()
    if(val === text) return i
  }
  return -1
}


export function findTagShowById(
  id: string, 
  tagList: TagView[],
  parents?: string[],
): TagShow | null {
  if(!parents) parents = []
  for(let i=0; i<tagList.length; i++) {
    const v = tagList[i]
    if(v.oState === "REMOVED") continue
    if(v.tagId === id) {
      parents.push(v.text)
      const obj: TagShow = {
        tagId: v.tagId,
        text: parents.join(" / "),
        emoji: v.icon ? decodeURIComponent(v.icon) : undefined,
      }
      return obj
    }
    if(v.children) {
      parents.push(v.text)
      const tmp = findTagShowById(id, v.children, parents)
      if(tmp) return tmp
      else parents.pop()
    }
  }

  return null
}

export function addTagToTagList(
  texts: string[],
  tagList: TagView[],
  icon?: string,
) {

  let tagId = ""
  const keyWords = texts.splice(0, 1)
  const keyWord = keyWords[0]
  const key_lower = keyWord.toLowerCase()

  let hasFind = false
  
  const now = time.getTime()

  for(let i=0; i<tagList.length; i++) {
    const v = tagList[i]
    const text = v.text.toLowerCase()
    if(text !== key_lower) continue
    hasFind = true
    tagId = v.tagId
    if(v.oState === "REMOVED") {
      v.oState = "OK"
      v.updatedStamp = now
    }
    if(texts.length > 0) {
      let tmpList = v.children ?? []
      const data = addTagToTagList(texts, tmpList, icon)
      v.children = data.tagList
      tagId = data.tagId
    }
    break
  }

  if(!hasFind) {
    const obj: TagView = {
      tagId: ider.createTagId(),
      text: keyWord,
      icon: texts.length < 1 ? icon : undefined,
      oState: "OK",
      createdStamp: now,
      updatedStamp: now,
    }
    if(texts.length > 0) {
      const data = addTagToTagList(texts, [], icon)
      obj.children = data.tagList
      tagId = data.tagId
    }
    else {
      tagId = obj.tagId
    }
    tagList.splice(0, 0, obj)
  }

  return { tagList, tagId }
}