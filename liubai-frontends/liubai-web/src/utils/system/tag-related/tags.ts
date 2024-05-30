
import type { TagView } from "../../../types/types-atom";
import { 
  findWhichTagChange,
  findTagShowById,
} from "./tools/tag-util";
import liuUtil from "../../liu-util";
import cui from "../../../components/custom-ui";
import { i18n } from "../../../locales"
import { updateContentForTagAcross } from "./tools/content-util";
import { updateDraftForTagAcross } from "./tools/draft-util";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";
import { toSetTagList } from "./tools/some-foos";

interface TagMovedInTreeRes {
  moved: boolean
  newNewTree?: TagView[]
}

/**
 * 删掉结构有问题的 tag 并且移除 oState 为 REMOVED 的 leaf
 */
export function filterTag(
  tree: TagView[],
  hasChange: boolean = false,
) {

  for(let i=0; i<tree.length; i++) {
    const leaf = tree[i]
    if(leaf.oState === "REMOVED") {
      tree.splice(i, 1)
      i--
      continue
    }

    if(!leaf.tagId || !leaf.text) {
      hasChange = true
      tree.splice(i, 1)
      i--
      continue
    }

    if(leaf.children) {
      const res = filterTag(leaf.children, hasChange)
      if(res.hasChange) {
        hasChange = res.hasChange
        leaf.children = res.tree
        if(leaf.children.length < 1) {
          delete leaf.children
        }
      }
    }
  }

  return { tree, hasChange }
}

export async function tagMovedInTree(
  newTree: TagView[], 
  oldTree: TagView[]
): Promise<TagMovedInTreeRes> {
  const res = findWhichTagChange(newTree, oldTree, newTree, oldTree)

  console.log("tagMovedInTree 看一下 res: ")
  console.log(res)
  console.log(" ")

  // 没有 tag 发生变化，代表移动后又拖回原位了
  if(!res.tagId) return { moved: true }

  const { t } = i18n.global
  let newNewTree = res.newNewTree

  // 是跨级移动，并且发现已有一样的 tag，那么这时要去询问一下用户确定吗
  if(res.changeType === "across" && res.isMerged) {
    let newTagShow = findTagShowById(res.tagId, newTree)
    let oldTagShow = findTagShowById(res.tagId, oldTree)
    if(!newTagShow || !oldTagShow) return { moved: false }
    let tag1 = oldTagShow.text
    let tag2 = newTagShow.text
    const res2 = await cui.showModal({
      title: t("tip.tag_merge_title"),
      content: t("tip.tag_merge_content", { tag1, tag2 })
    })
    if(res2.cancel) {
      return { moved: false }
    }
  }

  // 修改 workspaceStore
  const rawList = liuUtil.getRawList(newNewTree ?? newTree)
  const res3 = await toSetTagList(rawList)
  if(!res3) {
    console.log("操作失败........")
    return { moved: false }
  }

  // 修改 contents / drafts
  if(res.changeType === "across") {
    const res4 = await updateContentForTagAcross(res)
    if(!res4) return { moved: false }
    const res5 = await updateDraftForTagAcross(res)
    if(!res5) return { moved: false }
  }

  // 去触发全局，让其他组件得知 tag 发生了变化
  const gStore = useGlobalStateStore()
  gStore.addTagChangedNum("edit")

  return { moved: true, newNewTree }
}