import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore";
import { TagView } from "../../../types/types-atom";
import { findIndexInThisTagList } from "./tools/workspace-util"

// 返回当前工作区的 tags
export function getCurrentSpaceTagList(): TagView[] {
  const store = useWorkspaceStore()
  const workspace = store.currentSpace
  if(!workspace) return []
  const tagList = workspace.tagList
  if(!tagList?.length) return []
  return tagList
}

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


// 校验当前给定的 tag 名称（忽略大小写），是否已有 tagId
// 注意: 若 oState 已是 REMOVED 时，会查无 tagId
export function findTagId(val: string) {
  const tagList = getCurrentSpaceTagList()
  if(!val) return ""
  if(!tagList || tagList.length < 1) return ""

  val = formatTagText(val)
  let tagNames = val.split("/")
  let newTagList = JSON.parse(JSON.stringify(tagList)) as TagView[]

  let tagId = ""
  
  for(let i=0; i<tagNames.length; i++) {
    const name = tagNames[i]
    const idx = findIndexInThisTagList(name, newTagList)
    if(idx < 0) return ""
    let tagView = newTagList[idx]
    tagId = tagView.tagId
    newTagList = tagView.children ?? []
  }

  return tagId
}