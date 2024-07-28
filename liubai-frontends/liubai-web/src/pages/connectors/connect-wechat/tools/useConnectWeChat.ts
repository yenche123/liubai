import { reactive, watch } from "vue"
import type { CwcData } from "./types"
import liuEnv from "~/utils/liu-env"
import { pageStates } from "~/utils/atom"
import { useAwakeNum } from "~/hooks/useCommon"
import { useNetworkStore } from "~/hooks/stores/useNetworkStore"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"

export function useConnectWeChat() {

  const hasBE = liuEnv.hasBackend()

  const cwcData = reactive<CwcData>({
    pageState: hasBE ? pageStates.LOADING : pageStates.NEED_BACKEND,
    wechatRemind: false,
  })

  const onWechatRemindChanged = (val: boolean) => {

  }

  const { syncNum, awakeNum } = useAwakeNum()
  watch(awakeNum, (newV) => {
    if(syncNum.value < 1) return
    if(newV < 1) return
    checkoutData(cwcData)
  }, { immediate: true })

  return {
    cwcData,
    onWechatRemindChanged,
  }
}

async function checkoutData(
  cwcData: CwcData,
) {

  console.log("checkoutData......")

  // 1. checking out network
  const nStore = useNetworkStore()
  if(nStore.level < 1) {
    cwcData.pageState = pageStates.NETWORK_ERR
    return
  }

  // 2. get param
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return

  // 3. fetch data
  
}