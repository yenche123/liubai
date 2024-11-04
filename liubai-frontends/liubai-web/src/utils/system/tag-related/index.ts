import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import type { TagView } from "~/types/types-atom";
import type { TagShow } from "~/types/types-content";
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
  AddTagsParam,
  AddATagAtom,
  AddTagsRes,
  CreateTagsFromTagShowsRes,
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
import { toSetTagList } from "./tools/some-foos"
import { type LiuTagTreeStat } from "~/types";

// 返回当前工作区的 tags
export function getCurrentSpaceTagList(): TagView[] {
  const wStore = useWorkspaceStore()
  const workspace = wStore.currentSpace
  if(!workspace) return []
  const tagList = workspace.tagList
  if(!tagList?.length) return []
  const list = liuUtil.getRawList(tagList)
  return list
}


/**
 * 转换文字成规范格式
 * 1. 全局过滤掉 \n
 * 2. 过滤掉各级前后空格以及中间多余的空格
 * 也就是说，“/” 前后不会有空格
 * @param val 过滤前的文字
 */
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

/** 只会转换没有被删除的 tagId 们 */
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
 * 将 tagIds 们添加进 wStore 并且存储到我的 member 信息中
 * @param tagIds 要添加进 "最近记录" 里的 tagId 们
 * @return 会返回新的 searchTagIds 或者 undefined
 */
export async function addTagIdsToRecents(tagIds: string[]) {
  const wStore = useWorkspaceStore()
  const memberCfg = wStore.myMember?.config ?? {}
  const { searchTagIds = [] } = memberCfg

  let hasChanged = false
  for(let i=0; i<tagIds.length; i++) {
    const v = tagIds[i]

    if(!v) continue
    hasChanged = true

    const idx = searchTagIds.indexOf(v)
    if(idx >= 0) {
      searchTagIds.splice(idx, 1)
    }
    searchTagIds.unshift(v)
  }

  if(!hasChanged) return

  const len = searchTagIds.length
  if(len > 10) {
    searchTagIds.splice(10, len - 10)
  }
  memberCfg.searchTagIds = searchTagIds
  await wStore.setMemberConfig(memberCfg)
  return [...searchTagIds]
}

/**
 * 将一个标签添加到 tagList 里
 */
export async function addATag(opt: AddATagParam): Promise<AddATagRes> {
  const wStore = useWorkspaceStore()
  const workspace = wStore.currentSpace
  if(!workspace) return { isOk: false, errMsg: "no workspace locally" }
  let tagList = workspace.tagList ?? []
  const texts = opt.text.split("/")
  const data = addTagToTagList(texts, tagList, opt.icon)
  const newTagId = data.tagId
  await toSetTagList(data.tagList)

  if(newTagId) {
    await addTagIdsToRecents([newTagId])
  }

  return { isOk: true, id: newTagId }
}


export async function addTags(list: AddTagsParam): Promise<AddTagsRes> {
  const wStore = useWorkspaceStore()
  const workspace = wStore.currentSpace
  if(!workspace) return { isOk: false, errMsg: "no workspace locally" }
  let tagList = workspace.tagList ?? []
  const results: AddATagAtom[] = []
  const newTagIds: string[] = []

  // 1. 一个个把 tag 塞进 tagList 中
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const texts = v.text.split("/")
    const data = addTagToTagList(texts, tagList, v.icon)
    const id = data.tagId
    results.push({ text: v.text, id })
    newTagIds.push(id)
    tagList = data.tagList
  }

  // 2. 修改 workspace wStore
  await toSetTagList(tagList)

  // 3. 通知全局
  const gStore = useGlobalStateStore()
  gStore.addTagChangedNum("create")

  // 4. 将新的 tagIds 写入到 recent 里
  if(newTagIds.length > 0) {
    await addTagIdsToRecents(newTagIds)
  }
  
  return { isOk: true, results }
}

/**
 * 为 TagShow[] 中没有 tagId 的元素创建标签
 * @return 返回新的 TagShows
 */
export async function createTagsFromTagShows(
  tagShows: TagShow[]
): Promise<CreateTagsFromTagShowsRes> {
  const tmpList: AddTagsParam = []
  for(let i=0; i<tagShows.length; i++) {
    const v = tagShows[i]
    if(v.tagId) continue
    const txt = formatTagText(v.text)
    tmpList.push({ text: txt })
  }
  if(tmpList.length < 1) {
    return { isOk: true, tagShows }
  }
  const addRes = await addTags(tmpList)
  const results = addRes.results
  if(!addRes.isOk || !results) {
    return { isOk: false, tagShows }
  }
  
  tagShows.forEach(v => {
    if(v.tagId) return
    const [atom] = results.splice(0, 1)
    v.tagId = atom.id
  })

  return { isOk: true, tagShows }
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
  await toSetTagList(newList)

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
  const wStore = useWorkspaceStore()
  const workspace = wStore.currentSpace
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
  
  await toSetTagList(res2)

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
  await toSetTagList(newList)
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
  await toSetTagList(newList)

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
  tagSearched = valTool.uniqueArray(tagSearched)
  return tagSearched
}

export function hasStrangeChar(val: string) {
  const strange_char = "~@#$%^*'\"{}\\`?><"
  for(let i=0; i<val.length; i++) {
    const v = val[i]
    const res = strange_char.includes(v)
    if(res) return true
  }
  return false
}

/**
 * 从文字 val 中，获取其层级数
 */
export function getLevelFromText(val: string) {
  const list = val.split("/")
  return list.length
}

export function useTagsTree() {
  const onTapTagArrow = (
    e: MouseEvent, 
    node: TagView, 
    stat: LiuTagTreeStat,
  ) => {
    const length = stat.children.length
    if(!length) return
    stat.open = !stat.open
  }

  const closedNodes: Record<string, boolean | undefined> = {}
  const onOpenNode = (stat: LiuTagTreeStat) => {
    const tagId = stat.data.tagId
    if(!tagId) return
    closedNodes[tagId] = false
  }

  const onCloseNode = (stat: LiuTagTreeStat) => {
    const tagId = stat.data.tagId
    if(!tagId) return
    closedNodes[tagId] = true
  }

  const statHandler = (stat: LiuTagTreeStat) => {
    const tagId = stat.data.tagId
    if(!tagId) return stat
    const isClosed = closedNodes[tagId]
    if(isClosed) stat.open = false

    const cLength = stat.data.children?.length ?? 0
    if(cLength >= 5) {
      stat.open = false
    }
    
    return stat
  }

  return {
    onTapTagArrow,
    onOpenNode,
    onCloseNode,
    statHandler,
  }
}