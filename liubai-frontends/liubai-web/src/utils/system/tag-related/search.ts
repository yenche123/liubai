import type { TagSearchItem } from "./tools/types"
import type { TagView } from "~/types/types-atom"
import { getCurrentSpaceTagList } from "~/utils/system/tag-related"
import liuApi from "~/utils/liu-api"

/**
 * 从 useWorkspaceStore 里取数据，开始查找，返回 TagSearchItem[]
 * 用户可能输入 yyy/zzz 那么 xxx/yyy/zzz 的结果必须找出来
 * @param text 必须已 format 过了
 */
export function searchLocal(text: string) {
  const texts = text.split("/")
  const tagList = getCurrentSpaceTagList()
  if(tagList.length < 1) return []
  const data = _searchInList(texts, [], tagList)
  return _sortList(data, texts)
}

function _sortList(
  list: TagSearchItem[],
  texts: string[],
) {
  if(list.length < 2) return list

  // 分数越高 排得越后面
  const _getScore = (txt: string) => {
    let score = 0
    const txt2 = txt.toLowerCase()
    texts.forEach(v => {
      let idx = txt2.indexOf(v.toLowerCase())
      if(idx < 0) score += 100
      else score += idx
    })
    return score
  }

  const _compare = (a: TagSearchItem, b: TagSearchItem) => {
    const aText = a.textBlank
    const bText = b.textBlank
    const aScore = _getScore(aText)
    const bScore = _getScore(bText)
    if(aScore > bScore) return 1
    else if(aScore < bScore) return -1
    return 0
  }
  list.sort(_compare)
  return list
}


// 递归检测 tagViews，查看是否有匹配由关键词组成的 texts
function _searchInList(
  texts: string[], 
  parents: string[], 
  tagViews: TagView[],
  parentIcon?: string,
) {
  let list: TagSearchItem[] = []

  for(let i=0; i<tagViews.length; i++) {
    const v = tagViews[i]
    if(v.oState !== "OK") continue
    const newParents = [...parents, v.text]

    const res1 = _searchInTagView(texts, parents, v)
    if(res1) {
      let textBlank = v.text
      if(parents.length > 1) textBlank = parents.join(" / ") + " / " + v.text
      else if(parents.length > 0) textBlank = parents[0] + " / " + v.text

      const obj: TagSearchItem = {
        tagId: v.tagId,
        textBlank,
        emoji: v.icon ? liuApi.decode_URI_component(v.icon) : undefined,
        parentEmoji: parentIcon ? liuApi.decode_URI_component(parentIcon) : undefined,
      }
      list.push(obj)
      if(list.length < 10 && v.children) {
        const tmpList = _pushSomeChildren(newParents, v.children)
        list = list.concat(tmpList)
      }
    }
    else if(v.children) {
      const tmpList = _searchInList(texts, newParents, v.children, v.icon)
      list = list.concat(tmpList)
    }

  }

  return list
}

/**
 * 多放一些已匹配到的节点的子节点进来
 */
function _pushSomeChildren(
  parents: string[],
  children: TagView[]
) {
  const list: TagSearchItem[] = []
  for(let i=0; i<children.length; i++) {
    if(i >= 3) break
    const v = children[i]
    if(v.oState !== "OK") continue
    let textBlank = v.text
    if(parents.length > 1) textBlank = parents.join(" / ") + " / " + v.text
    else if(parents.length > 0) textBlank = parents[0] + " / " + v.text

    const obj: TagSearchItem = {
      tagId: v.tagId,
      textBlank,
      emoji: v.icon ? liuApi.decode_URI_component(v.icon) : undefined
    }
    list.push(obj)
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
  // console.log("看一下 texts: ", texts)
  // console.log("看一下 newTexts: ", newTexts)
  let newParents = [...parents]
  newParents.reverse()

  const list = [tagView.text, ...newParents]
  for(let i=0; i<newTexts.length; i++) {
    const v1 = newTexts[i].toLowerCase()
    const v2 = list[0].toLowerCase()

    if(v2.startsWith(v1)) {
      list.splice(0, 1)
      continue
    }
    return false
  }

  return true
}