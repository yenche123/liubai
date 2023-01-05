import type {
  ThreadOperation
} from "../../thread-list/tools/types"
import { handleCollect } from "./handleCollect"
import type { TdData } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { ToidCtx } from "./types"

export function useThreadOperateInDetail(
  tdData: TdData,
) {
  const rr = useRouteAndLiuRouter()

  const receiveOperation = (
    operation: ThreadOperation,
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
    else if(operation === "comment") {

    }
    else if(operation === "emoji") {

    }
    else if(operation === "share") {

    }
  }

  return {
    receiveOperation
  }
}
