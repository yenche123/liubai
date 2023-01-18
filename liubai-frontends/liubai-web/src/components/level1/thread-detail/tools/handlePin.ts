import type { PreCtx } from "../../utils/tools/types"
import { ThreadShow } from "~/types/types-content"
import valTool from "~/utils/basic/val-tool"
import commonOperate from "../../utils/common-operate"
import { preHandle } from "../../utils/preHandle"

export async function handlePin(ctx: PreCtx) {
  const { thread } = ctx
  const data = await preHandle(ctx)
  if(!data) return
  handle(thread, data.memberId, data.userId)
}

async function handle(
  thread: ThreadShow, 
  memberId: string, 
  userId: string
) {
  const oldThread = valTool.copyObject(thread)

  // 1. 执行公共逻辑
  const { tipPromise } = await commonOperate.toPin(oldThread, memberId, userId)
  if(!tipPromise) return

  // 2. 等待 snackbar 的 promise
  const res2 = await tipPromise
  if(res2.result !== "tap") return
  
  // 发生撤销之后
  // 3. 去执行公共的取消逻辑
  await commonOperate.undoPin(oldThread, memberId, userId)
}