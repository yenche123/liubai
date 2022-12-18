import { toRaw } from "vue";
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore";
import type { TagView } from "../../../types/types-atom";
import type { TagShow } from "../../../types/types-content";
import liuUtil from "../../liu-util";
import { 
  findIndexInThisTagList,
  findTagShowById,
  findTagViewById,
  getTagViewLevel,
  deleteATagView,
  addTagToTagList,
  findParentOfTag,
  getMergedChildTree,
  generateNewTreeForMerge,
  getChildrenAndMeIds,
} from "./tools/tag-util"
import type {
  AddATagParam,
  RenameTagParam,
  AddATagRes,
  BaseTagRes,
} from "./tools/types"
import { updateContentForTagRename } from "./tools/content-util"

// 返回当前工作区的 tags
export function getCurrentSpaceTagList(): TagView[] {
  const store = useWorkspaceStore()
  const workspace = store.currentSpace
  if(!workspace) return []
  const tagList = workspace.tagList
  if(!tagList?.length) return []
  const list = liuUtil.getRawList(tagList)
  return list
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

export function tagIdsToShows(ids: string[]) {
  const tagList = getCurrentSpaceTagList()
  if(tagList.length < 1) return { tagShows: [], newIds: [] }
  const tagShows: TagShow[] = []
  const newIds: string[] = []

  for(let i=0; i<ids.length; i++) {
    const id = ids[i]
    const res = findTagShowById(id, tagList)
    if(res) {
      tagShows.push(res)
      newIds.push(id)
    }
  }

  return { tagShows, newIds }
}




/**
 * 将一个标签添加到 tagList 里
 */
export async function addATag(opt: AddATagParam): Promise<AddATagRes> {
  const store = useWorkspaceStore()
  const workspace = store.currentSpace
  if(!workspace) return { isOk: false, errMsg: "no workspace locally" }
  let tagList = workspace.tagList ?? []
  const texts = opt.text.split("/")
  const data = addTagToTagList(texts, tagList, opt.icon)
  const res = await store.setTagList(data.tagList)
  return { isOk: true, id: data.tagId }
}


/**
 * 修改一个标签的 text 或 icon
 */
export async function editATag(opt: RenameTagParam): Promise<BaseTagRes> {
  const texts = opt.text.split("/").map(v => v.trim())
  const children = getChildrenAndMeIds(opt.originTag)

  // 检查层级是否大于 3
  const level = texts.length - 1 + getTagViewLevel([opt.originTag])
  if(level > 3) {
    return { isOk: false, errMsg: "level has been more than 3", errCode: "01" }
  }

  // 获取 tagList
  const tagList = getCurrentSpaceTagList()
  const oldList = JSON.parse(JSON.stringify(tagList)) as TagView[]

  // 先去删除
  deleteATagView(oldList, opt.id)

  // 再去重建
  const { tagList: tagList2 } = addTagToTagList(texts, oldList, opt.icon, opt.originTag)

  // 修改 workspaceStore
  const newList = JSON.parse(JSON.stringify(tagList2)) as TagView[]
  console.log("去修改 workspaceStore:::")
  console.log(newList)
  console.log(" ")
  const wStore = useWorkspaceStore()
  const res = await wStore.setTagList(newList)

  // 更新 contents
  const res2 = await updateContentForTagRename(children, newList)

  // drafts 不用更新 因为 draft 不涉及 tagSearched
  return { isOk: true }
}

export async function mergeTag(
  fromTagView: TagView, 
  fromId: string, 
  toId: string
): Promise<BaseTagRes> {
  const store = useWorkspaceStore()
  const workspace = store.currentSpace
  if(!workspace) return { isOk: false, errMsg: "no workspace locally" }
  let tagList = workspace.tagList ?? []
  const toTagView = findTagViewById(toId, tagList)
  if(!toTagView) return { isOk: false, errMsg: "no toTagView" }

  const toChild: TagView = JSON.parse(JSON.stringify(toTagView))
  const res = getMergedChildTree(fromTagView, toChild)
  console.log("mergeTag res: ")
  console.log(res)
  console.log(" ")

  const res2 = generateNewTreeForMerge(tagList, res.newChild, fromId)
  console.log("mergeTag res2: ")
  console.log(res2)
  console.log(" ")
  
  const res3 = await store.setTagList(res2)


  // 待完善，去更新 contents 和 drafts



  return { isOk: true }
}


/**
 * 查找一群 tagIds 的 parents Id，并包含自己本身
 */
export function getTagIdsParents(tagIds: string[]) {
  const tagList = getCurrentSpaceTagList()
  if(tagList.length < 1) return []
  let tagSearched: string[] = []
  for(let i=0; i<tagIds.length; i++) {
    const tagId = tagIds[i]
    const tmpList = findParentOfTag(tagId, [], tagList)
    if(tmpList.length < 1) continue
    tagSearched = tagSearched.concat(tmpList)
  }
  tagSearched = [...new Set(tagSearched)]
  return tagSearched
}