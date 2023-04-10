import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore";
import type { TagView } from "../../../types/types-atom";
import type { TagShow } from "../../../types/types-content";
import liuUtil from "../../liu-util";
import { 
  findIndexInThisTagList,
  findTagShowById,
  findTagViewById,
  deleteATagView,
  deleteTheTag,
  addTagToTagList,
  findParentOfTag,
  getMergedChildTree,
  generateNewTreeForMerge,
  getChildrenAndMeIds,
  toEditTagIcon,
} from "./tools/tag-util"
import type {
  AddATagParam,
  RenameTagParam,
  AddATagRes,
  BaseTagRes,
  WhichTagChange,
} from "./tools/types"
import { 
  updateContentForTagAcross, 
  updateContentForTagRename,
  updateContentForTagDeleted,
  deleteContentsForTagDeleted
} from "./tools/content-util"
import {
  updateDraftForTagAcross,
  updateDraftWhenTagDeleted,
} from "./tools/draft-util"
import valTool from "~/utils/basic/val-tool";

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
  let newTagList = valTool.copyObject(tagList)

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

  // 获取 tagList
  const tagList = getCurrentSpaceTagList()
  const oldList = valTool.copyObject(tagList)

  // 先去删除
  deleteATagView(oldList, opt.id)

  // 再去重建
  const { tagList: tagList2 } = addTagToTagList(texts, oldList, opt.icon, opt.originTag)

  // 修改 workspaceStore
  const newList = valTool.copyObject(tagList2)
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

  // 1. 先生成 fromTagView 的所有 tagId
  const children = getChildrenAndMeIds(fromTagView)

  // 2. 生成新的 child
  const toChild: TagView = valTool.copyObject(toTagView)
  const res = getMergedChildTree(fromTagView, toChild)
  // console.log("mergeTag res: ")
  // console.log(res)
  // console.log(" ")

  // 3. 把新的 child 加到 tree 中，并删掉旧的
  const res2 = generateNewTreeForMerge(tagList, res.newChild, fromId)
  // console.log("mergeTag res2: ")
  // console.log(res2)
  // console.log(" ")
  
  const res3 = await store.setTagList(res2)

  // 待完善，去更新 contents 和 drafts
  const param: WhichTagChange = {
    children,
    from_ids: res.from_ids,
    to_ids: res.to_ids,
  }
  const res4 = await updateContentForTagAcross(param)
  if(!res4) return { isOk: false }
  const res5 = await updateDraftForTagAcross(param)
  if(!res5) return { isOk: false }

  return { isOk: true }
}

export async function deleteTag(
  node: TagView,
  deleteThread: boolean
): Promise<BaseTagRes> {

  const tagId = node.tagId

  // 获取 tagList
  const tagList = getCurrentSpaceTagList()
  const newList = valTool.copyObject(tagList)

  deleteTheTag(tagId, newList)

  // 更新 tagList
  const wStore = useWorkspaceStore()
  const res = await wStore.setTagList(newList)
  const idAndChildren = getChildrenAndMeIds(node)

  // 删除动态或修改动态
  if(deleteThread) {
    const res2 = await deleteContentsForTagDeleted(tagId, newList)
    console.log("看一下删除动态的结果.....")
    console.log(res2)
  }
  else {
    const res2 = await updateContentForTagDeleted(idAndChildren, newList)
    console.log("看一下更新动态的结果.....")
    console.log(res2)
  }

  // 处理草稿
  const res3 = await updateDraftWhenTagDeleted(idAndChildren)

  return { isOk: true }
}

export async function editTagIcon(
  tagId: string, 
  icon?: string
): Promise<BaseTagRes> {
  // 获取 tagList
  const tagList = getCurrentSpaceTagList()
  const newList = valTool.copyObject(tagList)
  toEditTagIcon(tagId, newList, icon)

  // 更新 tagList
  const wStore = useWorkspaceStore()
  const res = await wStore.setTagList(newList)

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