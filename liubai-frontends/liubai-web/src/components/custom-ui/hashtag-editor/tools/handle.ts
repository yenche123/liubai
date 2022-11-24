import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore"
import type { TagItem } from "./types"
import type { TagView } from "../../../../types/types-atom"

// 转换文字成规范格式
// 1. 全局过滤掉 \n
// 2. 过滤掉各级前后空格以及中间多余的空格
export function formatTagText(val: string) {
  if(!val) return ""

  val = val.replace(/\n/g, "")

  const list = val.split("/")
  for(let i=0; i<list.length; i++) {
    let text = list[i]
    text = text.trim()
    if(!text) {
      list.splice(i, 1)
      i--
      continue
    }

    // 删除掉中间多余的空格
    let tmp = text.split(" ")
    tmp = tmp.filter(v => Boolean(v))
    list[i] = tmp.join(" ")
  }

  if(list.length < 1) return ""
  return list.join("/")
}

function _getTagList(): TagView[] {
  const store = useWorkspaceStore()
  const workspace = store.currentSpace
  if(!workspace) return []
  const tagList = workspace.tagList
  if(!tagList?.length) return []
  return tagList
}

/**
 * 从 useWorkspaceStore 里取数据，开始查找，返回 TagItem[]
 * 用户可能输入 yyy/zzz 那么 xxx/yyy/zzz 的结果必须找出来
 * @param text 必须已 format 过了
 */
export function searchLocal(text: string) {
  const texts = text.split("/")
  const tagList = _getTagList()
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
      const obj: TagItem = {
        tagId: tagView.tagId,
        textBlank: parents.join(" / ") + " / " + tagView.text,
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


export function findTagId(text: string) {
  const tagList = _getTagList()
  if(tagList.length < 1) return true
  const items = text.split("/")

  let idx = -1
  let tagId: string | undefined
  let theTagList = JSON.parse(JSON.stringify(tagList)) as TagView[]
  theTagList = theTagList.filter(v => v.oState === "OK")
  let texts = flatTagTexts(theTagList)

  for(let i=0; i<items.length; i++) {
    const keyWord = items[i]
    idx = texts.indexOf(keyWord)
    if(idx < 0) {
      tagId = undefined
      break
    }
    const theItem = theTagList[idx]
    tagId = theItem.tagId
    if(theItem.children) {
      theTagList = theItem.children
      theTagList = theTagList.filter(v => v.oState === "OK")
      texts = flatTagTexts(theTagList)
    }
    else {
      texts = []
    }
  }

  return tagId
}

function flatTagTexts(tagList: TagView[]) {
  let list: string[] = []
  tagList.forEach(v => {
    list.push(v.text)
  })
  return list
}
