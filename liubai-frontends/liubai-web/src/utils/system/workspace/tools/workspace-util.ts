import type { TagView } from "../../../../types/types-atom";
import { TagShow } from "../../../../types/types-content";


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
  tagList: TagView[]
): TagShow | null {
  for(let i=0; i<tagList.length; i++) {
    const v = tagList[i]
    if(v.oState === "REMOVED") continue
    if(v.tagId === id) {
      const obj: TagShow = {
        tagId: v.tagId,
        text: v.text,
        emoji: v.icon ? decodeURIComponent(v.icon) : undefined,
      }
      return obj
    }
    if(v.children) {
      const tmp = findTagShowById(id, v.children)
      if(tmp) return tmp
    }
  }

  return null
}