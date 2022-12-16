import { MenuItem } from "../../../../components/common/liu-menu/tools/types"
import { TagView } from "../../../../types/types-atom"
import liuApi from "../../../../utils/liu-api"
import type { Stat } from "./useSbTags"

export function useStMenu() {
  const cha = liuApi.getCharacteristic() 
  const isPC = cha.isPC
  const { menuList, menuList2 } = initMenu(isPC)

  return {
    isPC,
    menuList,
    menuList2,
    onTapMenuItem,
  }
}


function onTapMenuItem(
  item: MenuItem, 
  index: number, 
  node: TagView, 
  stat: Stat<TagView>
) {
  const { text_key } = item
  if(text_key === "tag_related.create") {
    handle_create(node, stat)
  }
  else if(text_key === "tag_related.edit") {
    handle_edit(node, stat)
  }
  else if(text_key === "tag_related.delete") {
    handle_delete(node, stat)
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

function handle_create(
  node: TagView,
  stat: Stat<TagView>
) {
  if(stat.level >= 3) return
  console.log("去创建....")

}

function handle_edit(
  node: TagView,
  stat: Stat<TagView>
) {
  console.log("去编辑....")

}

function handle_delete(
  node: TagView,
  stat: Stat<TagView>
) {
  console.log("去删除....")

}