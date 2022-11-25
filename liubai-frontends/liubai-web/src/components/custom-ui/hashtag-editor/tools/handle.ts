import type { TagItem } from "./types"
import type { TagView } from "../../../../types/types-atom"
import { getCurrentSpaceTagList } from "../../../../utils/system/workspace"

/**
 * 从 useWorkspaceStore 里取数据，开始查找，返回 TagItem[]
 * 用户可能输入 yyy/zzz 那么 xxx/yyy/zzz 的结果必须找出来
 * @param text 必须已 format 过了
 */
export function searchLocal(text: string) {
  const texts = text.split("/")
  const tagList = getCurrentSpaceTagList()
  if(tagList.length < 1) return []
  const data = _searchInList(texts, [], tagList)
  return data
}


// 递归检测 tagViews，查看是否有匹配由关键词组成的 texts
function _searchInList(
  texts: string[], 
  parents: string[], 
  tagViews: TagView[]
) {
  let list: TagItem[] = []

  for(let i=0; i<tagViews.length; i++) {
    const tagView = tagViews[i]
    if(tagView.oState !== "OK") continue

    const res1 = _searchInTagView(texts, parents, tagView)
    if(res1) {
      let textBlank = tagView.text
      if(parents.length > 1) textBlank = parents.join(" / ") + " / " + tagView.text
      else if(parents.length > 0) textBlank = parents[0] + " / " + tagView.text

      const obj: TagItem = {
        tagId: tagView.tagId,
        textBlank,
        emoji: tagView.icon ? decodeURIComponent(tagView.icon) : undefined
      }
      list.push(obj)
    }
    else if(tagView.children) {
      let newParents = [...parents, tagView.text]
      const tmpList = _searchInList(texts, newParents, tagView.children)
      list = list.concat(tmpList)
    }

  }

  return list
}



/**
 * 查找当前节点+其祖先节点，是否能完全匹配出关键词
 * @param texts 当前文字，经 "/" 拆分所组成的关键词列表
 * @param parents 当前节点的祖先节点之关键词列表
 * @param tagView 当前节点
 * @return 若有匹配则返回 true，否则为 false
 */
function _searchInTagView(texts: string[], parents: string[], tagView: TagView) {
  if(texts.length > parents.length + 1) return false

  if(texts.length === 1) {
    const t1 = texts[0].toLowerCase()
    const t2 = tagView.text.toLowerCase()
    return t2.startsWith(t1)
  }

  let newTexts = [...texts]
  newTexts.reverse()   // 反转
  console.log("看一下 texts: ", texts)
  console.log("看一下 newTexts: ", newTexts)
  let newParents = [...parents]
  newParents.reverse()

  const list = [tagView.text, ...newParents]
  for(let i=0; i<newTexts.length; i++) {
    const v1 = newTexts[i].toLowerCase()
    const v2 = list[0].toLowerCase()
    if(v1 === v2) {
      list.splice(0, 1)
      continue
    }
    return false
  }

  return true
}
