import { TagView } from "../../../../types/types-atom";


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