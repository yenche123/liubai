import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import { computed } from "vue";
import type {
  TcbProps,
  TcbEmits,
  TcbMenuItem,
} from "./types"
import time from "~/utils/basic/time";
import type { ThreadShow } from "~/types/types-content";


// 正常: 编辑、状态、删除
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
    iconName: "delete_forever_400",
    color: "#dc1e30"
  }
]

export function useTcBottombar(
  props: TcbProps,
  emits: TcbEmits,  
) {

  const footerMenu = computed<TcbMenuItem[]>(() => {
    const t = props.threadData
    if(t.oState !== "OK") {
      return MENU_2
    }
    const list = [...MENU_1]

    // 动态添加置顶/取消置顶
    handlePin(t, list)

    // 动态添加（倒计时器）开关
    handleCountdown(t, list)

    return list
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

function handlePin(
  t: ThreadShow,
  list: TcbMenuItem[],
) {
  // 动态添加置顶/取消置顶
  let pinObj: TcbMenuItem = {
    text_key: "common.pin",
    operation: "pin",
    iconName: "pin"
  }
  if(t.pinStamp) {
    // 已置顶，添加 "取消置顶"
    pinObj.text_key = "common.unpin"
    pinObj.iconName = "unpin"
  }
  list.splice(0, 0, pinObj)
}


function handleCountdown(
  t: ThreadShow,
  list: TcbMenuItem[],
) {
  const { whenStamp, config: cCfg } = t
  if(!whenStamp) return
  const now = time.getTime() 
  const diff = whenStamp - now
  if(diff < 1000) return

  let hourglassObj: TcbMenuItem = {
    text_key: "common.close_countdown",
    operation: "hourglass",
    iconName: "hourglass_disabled_400"
  }
  if(cCfg && cCfg.showCountdown === false) {
    hourglassObj.text_key = "common.open_countdown"
    hourglassObj.iconName = "hourglass_enable_400"
  }
  list.push(hourglassObj)
}
