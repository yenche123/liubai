import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import cui from "~/components/custom-ui"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import type { TagView } from "~/types/types-atom"
import liuApi from "~/utils/liu-api"
import { 
  addATag, 
  tagIdsToShows, 
  editATag, 
  mergeTag, 
  deleteTag,
  editTagIcon,
  getLevelFromText,
} from "~/utils/system/tag-related"
import type { Stat } from "./useSbTags"
import type { Ref } from "vue"
import { i18n } from "~/locales"
import type { T_i18n } from "~/locales"
import type { RenameTagParam } from "~/utils/system/tag-related/tools/types"
import { getTagViewLevel } from "~/utils/system/tag-related/tools/tag-util"
import time from "~/utils/basic/time"

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
    else if(text_key === "common.edit") {
      handle_edit(node, stat, ctx)
    }
    else if(text_key === "common.delete") {
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
      text_key: "common.edit"
    },
    {
      text_key: "common.delete"
    }
  ]

  const menuList2: MenuItem[] = [
    {
      text_key: "tag_related.create"
    },
    {
      text_key: "common.edit"
    },
    {
      text_key: "common.delete"
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
  gStore.addTagChangedNum("create")
}

async function handle_edit(
  node: TagView,
  stat: Stat<TagView>,
  ctx: StmCtx,
) {
  const oldTagId = node.tagId
  const { tagShows } = tagIdsToShows([oldTagId])
  if(tagShows.length < 1) return
  const tShow = tagShows[0]
  const oldText = tShow.text
  const oldEmoji = tShow.emoji
  const res = await cui.showHashTagEditor({
    text: oldText,
    mode: "edit",
    icon: oldEmoji ? liuApi.encode_URI_component(oldEmoji) : undefined,
  })

  if(!res.confirm || !res.text) return
  const gStore = useGlobalStateStore()

  const newTagId = res.tagId
  if(newTagId === oldTagId) {
    // 待完善，检查有没有改了 emoji
    if(res.icon === node.icon) return
    const res2 = await editTagIcon(oldTagId, res.icon)
    node.icon = res.icon
    ctx.lastTagChangeStamp.value = time.getTime()
    gStore.addTagChangedNum("edit")
    return
  }
  
  const { t } = i18n.global

  // 检查层级是否已大于 3
  const currentLevel = getLevelFromText(res.text)
  const totalLevel = currentLevel - 1 + getTagViewLevel([node])
  if(totalLevel > 3) {
    _showErr(t, "01")
    return
  }

  // 去编辑
  if(!newTagId) {
    const param: RenameTagParam = {
      id: oldTagId,
      text: res.text,
      icon: res.icon,
      originTag: node,
    }
    const res2 = await editATag(param)
    if(res2.isOk) {
      gStore.addTagChangedNum("edit")
      return
    }
    console.log("没有编辑成功.....")
    console.log(res2)
    _showErr(t, res2.errCode)
    return
  }

  // 去合并
  const newText = res.text.replace("/", " / ")
  const res2 = await cui.showModal({
    title: t("tip.tag_merge_title"),
    content: t("tip.tag_merge_content", { tag1: oldText, tag2: newText })
  })
  if(!res2.confirm) return
  const res3 = await mergeTag(node, oldTagId, newTagId)
  if(!res3.isOk) return
  gStore.addTagChangedNum()
}

function _showErr(
  t: T_i18n,
  err?: string
) {
  if(!err) return
  let title = t("tip.tip")
  let content = ""
  if(err === "01") {
    content = t("tag_related.level_limit", { level: "3" })
  }
  if(!content) return
  cui.showModal({
    title,
    content,
    showCancel: false,
  })
}

async function handle_delete(
  node: TagView,
  stat: Stat<TagView>
) {
  const tagId = node.tagId
  const { tagShows } = tagIdsToShows([tagId])
  const firstTag = tagShows[0]
  if(!firstTag) return
  const tag = firstTag.text
  const res = await cui.showModal({
    title_key: "tag_related.delete_hd",
    content_key: "tag_related.delete_bd",
    content_opt: { tag },
    tip_key: "tag_related.delete_tip"
  })
  if(!res.confirm) return
  const deleteContent = Boolean(res.tipToggle)
  const res2 = await deleteTag(node, deleteContent)

  console.log("已更新完标签、动态和草稿，去通知其他组件.......")
  const gStore = useGlobalStateStore()
  gStore.addTagChangedNum("delete")
}