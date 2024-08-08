import { reactive, watch } from "vue"
import type { CwcData } from "./types"
import liuEnv from "~/utils/liu-env"
import { pageStates } from "~/utils/atom"
import { useAwakeNum } from "~/hooks/useCommon"
import { useNetworkStore } from "~/hooks/stores/useNetworkStore"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { Res_OC_GetWeChat } from "~/requests/req-types"
import cui from "~/components/custom-ui"

export function useConnectWeChat() {

  const hasBE = liuEnv.hasBackend()

  const cwcData = reactive<CwcData>({
    pageState: hasBE ? pageStates.LOADING : pageStates.NEED_BACKEND,
    ww_qynb_toggle: false,
    wx_gzh_toggle: false,
  })

  const onWechatRemindChanged = (val: boolean) => {

  }

  const onTapAddWeChat = async () => {
    await cui.showBindAccount({ bindType: "ww_qynb" })
    checkoutData(cwcData)
  }

  const onTapFollowOnWeChat = async () => {

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
    onTapAddWeChat,
    onTapFollowOnWeChat,
  }
}

async function checkoutData(
  cwcData: CwcData,
) {

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
  const url = APIs.OPEN_CONNECT
  const w3 = {
    operateType: "get-wechat",
    memberId,
  }
  console.time("get-wechat")
  const res3 = await liuReq.request<Res_OC_GetWeChat>(url, w3)
  console.timeEnd("get-wechat")
  console.log(res3)
  console.log(" ")
  const code3 = res3.code
  const data3 = res3.data

  // 4. handle response
  if(code3 === "E4003") {
    cwcData.pageState = pageStates.NO_AUTH
  }
  else if(code3 === "E4004") {
    cwcData.pageState = pageStates.NO_DATA
  }
  else if(code3 === "0000") {
    cwcData.pageState = -1
  }
  else {
    cwcData.pageState = pageStates.NETWORK_ERR
  }

  cwcData.ww_qynb_external_userid = data3?.ww_qynb_external_userid
  cwcData.ww_qynb_toggle = Boolean(data3?.ww_qynb_toggle)
  cwcData.wx_gzh_openid = data3?.wx_gzh_openid
  cwcData.wx_gzh_toggle = Boolean(data3?.wx_gzh_toggle)
}