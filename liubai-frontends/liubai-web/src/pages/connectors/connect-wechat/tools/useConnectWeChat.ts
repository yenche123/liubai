import { onDeactivated, reactive, watch } from "vue"
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
import { 
  useRouteAndLiuRouter,
  type RouteAndLiuRouter,
} from "~/routes/liu-router"
import { useDebounceFn } from "~/hooks/useVueUse"
import valTool from "~/utils/basic/val-tool"
import cfg from "~/config"

let checkoutNum = 0

export function useConnectWeChat() {

  const hasBE = liuEnv.hasBackend()
  const rr = useRouteAndLiuRouter()

  const cwcData = reactive<CwcData>({
    pageState: hasBE ? pageStates.LOADING : pageStates.NEED_BACKEND,
    ww_qynb_toggle: false,
    wx_gzh_toggle: false,
    wx_gzh_subscribed: false,
  })

  const onWechatRemindChanged = useDebounceFn((val: boolean) => {
    toChangeWeChatRemind(cwcData, val)
  }, 400)

  const onTapAddWeChat = async () => {
    await cui.showQRCodePopup({ bindType: "ww_qynb" })
    checkoutData(cwcData, rr)
  }

  const onTapFollowOnWeChat = async () => {
    const fr = cwcData.fr
    await cui.showQRCodePopup({ bindType: "wx_gzh", fr })
    checkoutData(cwcData, rr)
  }

  const { syncNum, awakeNum } = useAwakeNum()
  watch(awakeNum, (newV) => {
    // console.log("awakeNum: ", newV)
    // console.log("syncNum: ", syncNum.value)
    if(newV < 1) return
    checkoutData(cwcData, rr)
  }, { immediate: true })

  onDeactivated(() => {
    if(checkoutNum > 0) {
      checkoutNum = 0
    }
  })

  return {
    cwcData,
    onWechatRemindChanged,
    onTapAddWeChat,
    onTapFollowOnWeChat,
  }
}

async function toChangeWeChatRemind(
  cwcData: CwcData,
  wx_gzh_toggle: boolean,
) {
  // 1. get param
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return

  // 2. fetch data
  const url = APIs.OPEN_CONNECT
  const w2 = {
    operateType: "set-wechat",
    memberId,
    wx_gzh_toggle,
  }
  await liuReq.request(url, w2)
}


async function checkoutData(
  cwcData: CwcData,
  rr: RouteAndLiuRouter,
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
  // console.time("get-wechat")
  const res3 = await liuReq.request<Res_OC_GetWeChat>(url, w3)
  checkoutNum++

  // console.timeEnd("get-wechat")
  // console.log(res3)
  // console.log(" ")
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
    cwcData.pageState = pageStates.OK
  }
  else {
    cwcData.pageState = pageStates.NETWORK_ERR
  }

  // 5. bind data
  cwcData.ww_qynb_external_userid = data3?.ww_qynb_external_userid
  cwcData.ww_qynb_toggle = Boolean(data3?.ww_qynb_toggle)
  cwcData.wx_gzh_openid = data3?.wx_gzh_openid
  cwcData.wx_gzh_toggle = Boolean(data3?.wx_gzh_toggle)
  cwcData.wx_gzh_subscribed = Boolean(data3?.wx_gzh_subscribed)

  // 6. open showQRCodePopup if route query is permitted
  if(checkoutNum !== 1) return
  checkoutQuery(cwcData, rr)
}

async function checkoutQuery(
  cwcData: CwcData,
  rr: RouteAndLiuRouter,
) {
  // 1. get query and bind fr
  const query = rr.route.query
  const fr = query?.fr
  if(!fr || typeof fr !== "string") {
    delete cwcData.fr
    return
  }
  cwcData.fr = fr

  // 2. replace route
  const newQuery = { ...query }
  delete newQuery.fr
  rr.router.replaceWithNewQuery(rr.route, newQuery)
  await valTool.waitMilli(cfg.frame_duration_2)

  // 3. showQRCodePopup
  if(fr === "wx_gzh") {
    await cui.showQRCodePopup({ bindType: "wx_gzh", fr: "wx_gzh" })
    checkoutData(cwcData, rr)
  }
}