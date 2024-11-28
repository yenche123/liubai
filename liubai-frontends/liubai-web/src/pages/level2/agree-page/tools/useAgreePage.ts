import { reactive, watch } from "vue"
import type { ApData } from "./types"
import { pageStates } from "~/utils/atom"
import { 
  type RouteAndLiuRouter, 
  useRouteAndLiuRouter,
} from "~/routes/liu-router"
import valTool from "~/utils/basic/val-tool"
import { SyncOperateAPI } from "~/types/types-cloud"
import liuReq from "~/requests/liu-req"
import APIs from "~/requests/APIs"
import { invokeWxJsSdk } from "~/utils/third-party/wx-js-sdk/handle-wx-js-sdk"

export function useAgreePage() {

  const apData = reactive<ApData>({
    pageState: pageStates.LOADING,
    contentType: "note",
  })

  const rr = useRouteAndLiuRouter()
  watch(rr.route, (newV) => {
    const { name, query } = newV
    if(name !== "agree") return
    const chatId = query.chatId
    if(!valTool.isStringWithVal(chatId)) return
    if(apData.chatId === chatId) return
    apData.chatId = chatId

    // to fetch data
    toGetData(apData)
    invokeWxJsSdk()
  }, { immediate: true })
  

  return {
    apData,
    onTapOK: () => toTapOK(apData, rr),
    onTapCheckItOut: () => toTapCheckItOut(apData, rr),
  }
}

async function toGetData(
  apData: ApData
) {
  // 1. contruct param
  const chatId = apData.chatId as string
  const param1: SyncOperateAPI.Param = {
    operateType: "agree-aichat",
    chatId,
  }

  // 2. request
  const url = APIs.SYNC_OPERATE
  const res = await liuReq.request<SyncOperateAPI.Res_AgreeAichat>(url, param1)
  const { code, data } = res

  // 3. handle result
  if(code === "E4003") {
    apData.pageState = pageStates.NO_AUTH
  }
  else if(code === "E4004") {
    apData.pageState = pageStates.NO_DATA
  }
  else if(code === "0000") {
    apData.pageState = pageStates.OK
  }
  else {
    apData.pageState = pageStates.NETWORK_ERR
  }

  // 4. handle data
  if(!data) return
  apData.contentId = data.contentId
  apData.contentType = data.contentType
}


function toTapOK(
  apData: ApData,
  rr: RouteAndLiuRouter,
) {


}

function toTapCheckItOut(
  apData: ApData,
  rr: RouteAndLiuRouter,
) {


}
