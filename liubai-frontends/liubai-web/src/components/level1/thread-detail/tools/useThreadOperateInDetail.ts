import type {
  ThreadOperation
} from "../../thread-list/tools/types"
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore"
import { getLocalPreference } from "../../../../utils/system/local-preference"
import { handleCollect } from "./handleCollect"
import type { TdData } from "./types"
import { useRouteAndLiuRouter } from "../../../../routes/liu-router"
import type { ToidCtx } from "./types"

export function useThreadOperateInDetail(
  tdData: TdData,
) {
  const wStore = useWorkspaceStore()
  const rr = useRouteAndLiuRouter()

  const receiveOperation = (
    operation: ThreadOperation,
  ) => {
    const { local_id: userId } = getLocalPreference()
    const { threadShow } = tdData

    if(!threadShow) return
    const ctx: ToidCtx = {
      wStore,
      userId,
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
