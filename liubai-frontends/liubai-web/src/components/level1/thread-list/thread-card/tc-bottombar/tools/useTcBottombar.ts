import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import { computed } from "vue";
import type {
  TcbProps,
  TcbEmits,
  TcbMenuItem,
} from "./types"


// 正常: 编辑、状态、编辑
const MENU_1: TcbMenuItem[] = [
  {
    text_key: "common.edit",
    operation: "edit",
    iconName: "edit_400"
  },
  {
    text_key: "common.state",
    operation: "state",
    iconName: "state_400",
  },
  {
    text_key: "common.delete",
    operation: "delete",
    iconName: "delete_400",
  }
]

// 已被删除时: 恢复、永久删除
const MENU_2: TcbMenuItem[] = [
  {
    text_key: "common.restore",
    operation: "restore",
    iconName: "restore_400"
  },
  {
    text_key: "common.delete_forever",
    operation: "delete_forever",
    iconName: "delete_forever_400"
  }
]

export function useTcBottombar(
  props: TcbProps,
  emits: TcbEmits,  
) {

  const footerMenu = computed<TcbMenuItem[]>(() => {
    const t = props.threadData
    if(t.oState === "OK") return MENU_1
    return MENU_2
  })

  const onTapMenuItem = (item: MenuItem, index: number) => {
    const theItem = footerMenu.value[index]
    if(!theItem) return
    const { operation } = theItem
    emits("newoperate", operation)
  }
  
  return {
    footerMenu,
    onTapMenuItem,
  }
}
