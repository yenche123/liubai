import type { TagView } from "~/types/types-atom";
import type { TagShow } from "~/types/types-content";
import liuApi from "~/utils/liu-api";
import ider from "../../../basic/ider";
import time from "../../../basic/time";
import valTool from "../../../basic/val-tool";
import liuUtil from "../../../liu-util";
import type { WhichTagChange } from "./types";

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
  tagList: TagView[],
  parents?: string[],
  parentIcon?: string,
): TagShow | null {
  if(!parents) parents = []
  for(let i=0; i<tagList.length; i++) {
    const v = tagList[i]
    if(v.oState === "REMOVED") continue
    if(v.tagId === id) {
      parents.push(v.text)
      const obj: TagShow = {
        tagId: v.tagId,
        text: parents.join(" / "),
        emoji: v.icon ? liuApi.decode_URI_component(v.icon) : undefined,
        parentEmoji: parentIcon ? liuApi.decode_URI_component(parentIcon) : undefined,
      }
      return obj
    }
    if(v.children) {
      parents.push(v.text)
      const tmp = findTagShowById(id, v.children, parents, v.icon)
      if(tmp) return tmp
      else parents.pop()
    }
  }

  return null
}

export function findTagViewById(
  id: string, 
  tagList: TagView[],
): TagView | null {
  for(let i=0; i<tagList.length; i++) {
    const v = tagList[i]
    if(v.oState === "REMOVED") continue
    if(v.tagId === id) {
      return v
    }
    if(v.children) {
      const res = findTagViewById(id, v.children)
      if(res) return res
    }
  }

  return null
}

// 返回有多少层，从 1 开始
export function getTagViewLevel(
  tagViews: TagView[],
  current: number = 1,
): number {
  let bigOne = current
  for(let i=0; i<tagViews.length; i++) {
    const v = tagViews[i]
    if(v.oState === "REMOVED") continue
    if(v.children?.length) {
      const tmp = getTagViewLevel(v.children, current + 1)
      if(tmp > bigOne) bigOne = tmp
    }
  }
  return bigOne
}

/**
 * 新建标签至 tagList 里
 * @param texts 
 * @param tagList 
 * @param icon 
 * @param originTag 只在 "编辑" 场景时有该值，表示原 tag 的信息
 * @returns 
 */
export function addTagToTagList(
  texts: string[],
  tagList: TagView[],
  icon?: string,
  originTag?: TagView,
) {

  let tagId = ""
  const keyWords = texts.splice(0, 1)
  const keyWord = keyWords[0]
  const key_lower = keyWord.toLowerCase()

  let hasFind = false
  
  const now = time.getTime()

  for(let i=0; i<tagList.length; i++) {
    const v = tagList[i]
    const text = v.text.toLowerCase()
    if(text !== key_lower) continue
    hasFind = true
    if(v.oState === "REMOVED") {
      v.oState = "OK"
      v.updatedStamp = now
    }
    if(texts.length > 0) {
      let tmpList = v.children ?? []
      const data = addTagToTagList(texts, tmpList, icon, originTag)
      v.children = data.tagList
      tagId = data.tagId
    }
    else {
      v.icon = icon
      if(originTag) {
        v.tagId = originTag.tagId
        v.children = originTag.children
        v.updatedStamp = now
        if(v.createdStamp > originTag.createdStamp) {
          v.createdStamp = originTag.createdStamp
        }
      }
      tagId = v.tagId
    }
    break
  }

  if(!hasFind) {
    const obj: TagView = {
      tagId: ider.createTagId(),
      text: keyWord,
      icon: texts.length < 1 ? icon : undefined,
      oState: "OK",
      createdStamp: now,
      updatedStamp: now,
    }
    if(texts.length > 0) {
      const data = addTagToTagList(texts, [], icon, originTag)
      obj.children = data.tagList
      tagId = data.tagId
    }
    else {
      if(originTag) {
        obj.tagId = originTag.tagId
        obj.createdStamp = originTag.createdStamp
        obj.children = originTag.children
      }
      tagId = obj.tagId
    }
    tagList.splice(0, 0, obj)
  }

  return { tagList, tagId }
}


/**
 * 查找当前 tagId 所有的 parents id
 * parents id 的顺序为最上游到小游，并且包含自己
 */
export function findParentOfTag(
  tagId: string,
  parentIds: string[],
  tagViews: TagView[],
): string[] {
  
  for(let i=0; i<tagViews.length; i++) {
    const v = tagViews[i]
    if(v.oState === "REMOVED") continue
    if(v.tagId === tagId) {
      parentIds.push(tagId)
      return parentIds
    }
    if(v.children?.length) {
      parentIds.push(v.tagId)
      const tmpList = findParentOfTag(tagId, parentIds, v.children)
      if(tmpList.length) return tmpList
      parentIds.pop()
    }
  }

  return []
}



/**
 * 查找哪个 tag 变到哪了
 */
export function findWhichTagChange(
  newChildren: TagView[],
  oldChildren: TagView[],
  newTree: TagView[],
  oldTree: TagView[],
): WhichTagChange {

  let offset = 0
  
  for(let i=0; i<newChildren.length; i++) {
    const v1 = newChildren[i]
    const v2 = oldChildren[i + offset]
    let { tagId, text } = v1
    if(v1.oState !== "OK") continue
    if(v1.tagId === v2?.tagId) {
      if(v1.children) {
        const res = findWhichTagChange(v1.children, v2.children ?? [], newTree, oldTree)
        if(res.tagId) return res
      }
      continue
    }
    
    // 来看看怎么个不一样
    // I. v2 不存在，代表被移动到了这里
    if(!v2 || v2.oState !== "OK") {
      return tagAddedHere(tagId, text, oldChildren, newTree, oldTree, v1)
    }

    // II. 剩下一种情况 v2 也存在，但与 v1 不一样
    // 这时又有两种可能: 1. tag 被插入到了这里   2. tag 被移走了    这两种情况导致两者不一样
    
    // 如果是 tag 被移走了，那么当前 v1 会跟下一个 v2 （设为 v3）一致
    // 这时就让 i--，offset++，continue，重新进入回圈再次比较这个 v1 和 v3，直到找到 "被移入" 的情况
    const v3 = oldChildren[i + 1]
    if(v3?.tagId === tagId) {
      i--
      offset++
      continue
    }

    // 剩下最后一种情况，tag 被移入到了这里
    return tagAddedHere(tagId, text, oldChildren, newTree, oldTree, v1)
  }

  return {}
}

function tagAddedHere(
  tagId: string,
  text: string,
  oldChildren: TagView[],
  newTree: TagView[],
  oldTree: TagView[],
  tagView: TagView,
): WhichTagChange {

  let parents1 = findParentOfTag(tagId, [], newTree)
  let parents2 = findParentOfTag(tagId, [], oldTree)

  // 平移的情况
  if(valTool.isSameSimpleList(parents1, parents2)) {
    return {
      changeType: "translate",
      tagId,
    }
  }

  
  // 跨级的情况
  let res: WhichTagChange = {
    changeType: "across",
    tagId,
    children: getChildrenAndMeIds(tagView)
  }
  let lowerText = text.toLowerCase()
  
  for(let i=0; i<oldChildren.length; i++) {
    const v = oldChildren[i]
    if(v.oState !== "OK") continue
    let lowerText2 = v.text.toLowerCase()
    if(lowerText === lowerText2) {
      res.isMerged = true
      let { newChild, to_ids, from_ids } = getMergedChildTree(tagView, v)
      res.to_ids = to_ids
      res.from_ids = from_ids
      res.newNewTree = generateNewTreeForMerge(newTree, newChild, tagId)
      break
    }
  }
  
  return res
}


// 获取 我的子级和孙级所有的 id
export function getChildrenAndMeIds(tagView: TagView) {
  const list: string[] = [tagView.tagId]

  const _get = (children: TagView[]) => {
    for(let i=0; i<children.length; i++) {
      const v = children[i]
      if(v.oState !== "OK") {
        continue
      }
      list.push(v.tagId)
      if(v.children) _get(v.children)
    }
  }
  if(tagView.children) _get(tagView.children)

  return list
}

/** 对两个 tagView 做一个合并，以 toChild 为基准
 * 得出新的 newChild / from_ids / to_ids
*/
export function getMergedChildTree(
  fromChild: TagView, 
  toChild: TagView
) {
  let newChild = valTool.copyObject(toChild)
  let from_ids = [fromChild.tagId]
  let to_ids = [toChild.tagId]

  const _handle = (
    from_children: TagView[],
    to_children: TagView[],
  ) => {

    // 先过滤 to_children 里，可能有 fromChild
    to_children = to_children.filter(v => v.tagId !== fromChild.tagId)

    let to_texts = to_children.map(v => {
      return v.text.toLowerCase()
    })
    const now = time.getTime()

    for(let i=0; i<from_children.length; i++) {
      const v = liuUtil.toRawData(from_children[i])
      const { text, oState } = v
      if(oState !== "OK") continue
      const idx = to_texts.indexOf(text.toLowerCase())

      // 如果 to_children 里没有这个文字的标签，就直接添加
      if(idx < 0) {
        v.updatedStamp = now
        to_children.push(v)
        continue
      }

      // 如果已有这个文字的标签，就往下检查 children
      const v2 = to_children[idx]
      v2.updatedStamp = now
      v2.oState = "OK"
      from_ids.push(v.tagId)
      to_ids.push(v2.tagId)
      if(v.children) {
        const tmp2_children = v2.children ?? []
        v2.children = _handle(v.children, tmp2_children)
      }
    }

    return to_children
  }

  if(fromChild.children) {
    let tmp_children = newChild.children ?? []
    newChild.children = _handle(fromChild.children, tmp_children)
  }
  
  deleteATagView([newChild], fromChild.tagId)

  return { newChild, from_ids, to_ids }
}


/**
 * 移除某个 tag，直接从节点上 delete 掉，而不是修改 oState
 * 再把某个节点替换成 newChild
 */
export function generateNewTreeForMerge(
  originTree: TagView[],
  newChild: TagView,
  removedId: string,
) {
  const newTree = valTool.copyObject(originTree)

  const _run = (tree: TagView[]) => {
    for(let i=0; i<tree.length; i++) {
      const v = tree[i]
      if(v.tagId === removedId) {
        tree.splice(i, 1)
        i--
        continue
      }
      if(v.tagId === newChild.tagId) {
        tree[i] = newChild
        continue
      }
      if(v.children) {
        _run(v.children)
      }
    }
  }
  _run(newTree)

  return newTree
}

// 整个从 tree 里砍掉，而不是修改 oState 而已
export function deleteATagView(
  tagViews: TagView[],
  tagId: string
): TagView[] | null {
  for(let i=0; i<tagViews.length; i++) {
    const v = tagViews[i]
    if(v.tagId === tagId) {
      tagViews.splice(i, 1)
      return tagViews
    }
    if(v.children?.length) {
      const tmp = deleteATagView(v.children, tagId)
      if(tmp) {
        if(tmp.length < 1) {
          delete v.children
        }
        return tagViews
      }
    }
  }
  
  return null
}

// 将 tag 的 oState 改为 REMOVED，并且移除 children
export function deleteTheTag(
  tagId: string,
  tagList: TagView[]
): boolean {
  for(let i=0; i<tagList.length; i++) {
    const v = tagList[i]
    if(v.tagId === tagId) {
      v.oState = "REMOVED"
      if(v.children) {
        delete v.children
      }
      return true
    }
    if(v.oState === "REMOVED") continue
    if(v.children) {
      const res = deleteTheTag(tagId, v.children)
      if(res) return res
    }
  }

  return false
}

export function toEditTagIcon(
  tagId: string,
  tagList: TagView[],
  icon?: string
): boolean {
  for(let i=0; i<tagList.length; i++) {
    const v = tagList[i]
    if(v.tagId === tagId) {
      v.icon = icon
      return true
    }
    if(v.oState === "REMOVED") continue
    if(v.children) {
      const res = toEditTagIcon(tagId, v.children, icon)
      if(res) return res
    }
  }

  return false
}