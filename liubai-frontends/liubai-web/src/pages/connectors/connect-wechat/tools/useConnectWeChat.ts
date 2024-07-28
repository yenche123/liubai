import { reactive } from "vue"
import type { CwcData } from "./types"

export function useConnectWeChat() {

  const cwcData = reactive<CwcData>({
    wechatRemind: false,
  })


  const onWechatRemindChanged = (val: boolean) => {

  }
  

  return {
    cwcData,
    onWechatRemindChanged,
  }
}