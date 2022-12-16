import { MenuItem } from "../../../../components/common/liu-menu/tools/types"
import liuApi from "../../../../utils/liu-api"

export function useStMenu() {
  const cha = liuApi.getCharacteristic() 
  const isPC = cha.isPC
  const { menuList, funcs } = initMenu(isPC)

  return {
    isPC,
    menuList,
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

  const funcs = [
    "edit",
    "delete",
  ]

  return { menuList, funcs }
}