import type { ThreadOutterOperation } from "~/types/types-atom"
import { handleCollect } from "./handleCollect"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { PreCtx } from "../../utils/tools/types"
import {
  handleDelete,
  handleRestore,
  handleDeleteForever,
} from "./handleDeleteRelated"
import {
  handlePin
} from "./handlePin"
import { handleSelectState } from "./handleState"
import type { ThreadShow } from "~/types/types-content"

export function useThreadOperateInDetail() {
  const rr = useRouteAndLiuRouter()

  const receiveOperation = (
    operation: ThreadOutterOperation,
    thread?: ThreadShow,
  ) => {

    if(!thread) return
    const ctx: PreCtx = {
      thread,
      rr
    }
    handleOutterOperation(ctx, operation)
  }

  return {
    receiveOperation
  }
}

function handleOutterOperation(
  ctx: PreCtx,
  operation: ThreadOutterOperation
) {

  console.log("handleOutterOperation..........")
  console.log(operation)
  console.log(" ")

  if(operation === "collect") {
    handleCollect(ctx)
  }
  else if(operation === "emoji") {

  }
  else if(operation === "delete") {
    handleDelete(ctx)
  }
  else if(operation === "restore") {
    handleRestore(ctx)
  }
  else if(operation === "delete_forever") {
    handleDeleteForever(ctx)
  }
  else if(operation === "pin") {
    handlePin(ctx)
  }
  else if(operation === "state") {
    handleSelectState(ctx)
  }
}