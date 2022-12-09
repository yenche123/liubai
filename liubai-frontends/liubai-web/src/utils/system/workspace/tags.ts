
import type { TagView } from "../../../types/types-atom";
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore";
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

interface TagMovedInTreeRes {
  moved: boolean
  newNewTree?: TagView[]
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
  const wStore = useWorkspaceStore()
  const rawList = liuUtil.getRawList(newNewTree ?? newTree)
  const res3 = await wStore.setTagList(rawList)
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
  gStore.addTagChangedNum()

  return { moved: true, newNewTree }
}