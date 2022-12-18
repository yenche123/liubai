import { MenuItem } from "../../../../components/common/liu-menu/tools/types"
import cui from "../../../../components/custom-ui"
import { useGlobalStateStore } from "../../../../hooks/stores/useGlobalStateStore"
import { TagView } from "../../../../types/types-atom"
import liuApi from "../../../../utils/liu-api"
import { addATag, tagIdsToShows, editATag, mergeTag } from "../../../../utils/system/workspace"
import type { Stat } from "./useSbTags"
import type { Ref } from "vue"
import { i18n } from "../../../../locales"

export interface StmCtx {
  tagNodes: Ref<TagView[]>
  oldTagNodes: Ref<TagView[]>
  lastTagChangeStamp: Ref<number>
}

export function useStMenu(ctx: StmCtx) {
  const cha = liuApi.getCharacteristic() 
  const isPC = cha.isPC
  const { menuList, menuList2 } = initMenu(isPC)

  const onTapMenuItem = (
    item: MenuItem, 
    index: number, 
    node: TagView, 
    stat: Stat<TagView>
  ) => {
    const { text_key } = item
    if(text_key === "tag_related.create") {
      handle_create(node, stat)
    }
    else if(text_key === "tag_related.edit") {
      handle_edit(node, stat, ctx)
    }
    else if(text_key === "tag_related.delete") {
      handle_delete(node, stat)
    }
  }

  return {
    isPC,
    menuList,
    menuList2,
    onTapMenuItem,
  }
}

function initMenu(isPC: boolean) {
  const menuList: MenuItem[] = [
    {
      text_key: "tag_related.edit"
    },
    {
      text_key: "tag_related.delete"
    }
  ]

  const menuList2: MenuItem[] = [
    {
      text_key: "tag_related.create"
    },
    {
      text_key: "tag_related.edit"
    },
    {
      text_key: "tag_related.delete"
    }
  ]

  return { menuList, menuList2 }
}

async function handle_create(
  node: TagView,
  stat: Stat<TagView>
) {
  if(stat.level >= 3) return
  const tagId = node.tagId
  const { tagShows } = tagIdsToShows([tagId])
  if(tagShows.length < 1) return
  const { text } = tagShows[0]
  let tmp = text + " / "
  const res = await cui.showHashTagEditor({
    text: tmp,
    mode: "edit",
  })

  if(!res.confirm || res.tagId || !res.text) return

  const param = {
    text: res.text,
    icon: res.icon,
  }
  const res2 = await addATag(param)

  if(!res2.id) {
    console.log("创建标签失败.......")
    return
  }
  const gStore = useGlobalStateStore()
  gStore.addTagChangedNum()
}

async function handle_edit(
  node: TagView,
  stat: Stat<TagView>,
  ctx: StmCtx,
) {
  console.log("去编辑....")
  const oldTagId = node.tagId
  const { tagShows } = tagIdsToShows([oldTagId])
  if(tagShows.length < 1) return
  const tShow = tagShows[0]
  const oldText = tShow.text
  const oldEmoji = tShow.emoji
  const res = await cui.showHashTagEditor({
    text: oldText,
    mode: "edit",
    icon: oldEmoji ? encodeURIComponent(oldEmoji) : undefined,
  })

  console.log("showHashTagEditor res: ")
  console.log(res)

  if(!res.confirm || !res.text) return
  const newTagId = res.tagId
  if(newTagId === oldTagId) {
    // 待完善，检查有没有改了 emoji
    return
  }
  
  const gStore = useGlobalStateStore()
  const { t } = i18n.global

  // 去编辑
  // if(!newTagId) {
  //   const param = {
  //     id: oldTagId,
  //     text: res.text,
  //     icon: res.icon,
  //   }
  //   const res2 = await editATag(param)
  //   if(!res2.isOk) return
  //   gStore.addTagChangedNum()
  //   return
  // }

  // 去合并
  // const res2 = await cui.showModal({
  //   title: t("tip.tag_merge_title"),
  //   content: t("tip.tag_merge_content", { tag1: oldText, tag2: res.text })
  // })
  // if(!res2.confirm) return
  // const res3 = await mergeTag(node, oldTagId, newTagId)
  // if(!res3.isOk) return
  // gStore.addTagChangedNum()
}

function handle_delete(
  node: TagView,
  stat: Stat<TagView>
) {
  console.log("去删除....")

}