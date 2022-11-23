import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore"
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

function _getTagList() {
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
 * @param text 
 */
export async function search(text: string) {
  const tagViews: TagView[] = []



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
