import type { ThreadOutterOperation } from "../../thread-list/tools/types"
import { handleCollect } from "./handleCollect"
import type { TdData } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { ToidCtx } from "./types"

export function useThreadOperateInDetail(
  tdData: TdData,
) {
  const rr = useRouteAndLiuRouter()

  const receiveOperation = (
    operation: ThreadOutterOperation,
  ) => {
    const { threadShow } = tdData

    if(!threadShow) return
    const ctx: ToidCtx = {
      thread: threadShow,
      rr
    }

    if(operation === "collect") {
      handleCollect(ctx)
    }
    else if(operation === "emoji") {

    }
  }

  return {
    receiveOperation
  }
}