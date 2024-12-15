import type { CcData, CcContext } from "./types"
import type { ComposingData } from "~/types/types-atom"
import type { LocationQuery } from "vue-router"
import { provide, reactive, shallowRef, watch } from "vue"
import { pageStates } from "~/utils/atom"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import valTool from "~/utils/basic/val-tool"
import { composingDataKey } from "~/utils/provide-keys"
import APIs from "~/requests/APIs"
import { SyncOperateAPI } from "~/types/types-cloud"
import liuReq from "~/requests/liu-req"

export function useComposeContent() {
  // 1. init data
  const ccData = reactive<CcData>({
    pageState: pageStates.LOADING,
  })
  const rr = useRouteAndLiuRouter()
  const composingDataRef = shallowRef<ComposingData>()
  provide(composingDataKey, composingDataRef)
  const ctx: CcContext = {
    ccData,
    rr,
    composingDataRef,
  }

  // 2. listen to route changed
  watch(rr.route, (newV) => {
    const { name, query } = newV
    if(name !== "compose") return

    const { chatId } = query
    console.log("chatId: ", chatId)
    if(valTool.isStringWithVal(chatId)) {
      if(chatId === ccData.chatId) return
      ccData.chatId = chatId
      toGetAiChat(ctx, chatId)
    }
    else {
      getDataFromQuery(ctx, query)
    }

  }, { immediate: true })

  return {
    ccData,
  }
}


async function toGetAiChat(
  ctx: CcContext,
  chatId: string,
) {
  const { ccData } = ctx
  const url = APIs.SYNC_OPERATE
  const body: SyncOperateAPI.Param = {
    operateType: "get-aichat",
    chatId,
  }
  const res1 = await liuReq.request<SyncOperateAPI.Res_GetAichat>(url, body)
  console.log("toGetAiChat res1: ")
  console.log(res1)
  const { code, data } = res1

  if(code === "0000" && data) {
    afterGettingAiChat(ctx, chatId, data)
  }
  else if(code === "E4003") {
    ccData.pageState = pageStates.NO_AUTH
  }
  else if(code === "E4004") {
    ccData.pageState = pageStates.NO_DATA
  }
  else {
    ccData.pageState = pageStates.NETWORK_ERR
  }
}

function afterGettingAiChat(
  ctx: CcContext,
  chatId: string,
  data: SyncOperateAPI.Res_GetAichat,
) {
  const { result, waitingData, contentId } = data

  if(result === "created" && contentId) {
    ctx.rr.router.replace({ 
      name: "edit", 
      params: { contentId },
    })
    return
  }

  if(!waitingData) {
    console.warn("waitingData is null")
    return
  }

  const composingData: ComposingData = {
    aiChatId: chatId,
    ...waitingData,
  }
  ctx.composingDataRef.value = composingData
  ctx.ccData.pageState = pageStates.OK
}



function getDataFromQuery(
  ctx: CcContext,
  query: LocationQuery,
) {
  // WIP

}
