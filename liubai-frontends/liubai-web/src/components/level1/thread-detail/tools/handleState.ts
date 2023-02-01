import type { PreCtx } from "../../utils/tools/types"
import { preHandle } from "../../utils/preHandle"
import valTool from "~/utils/basic/val-tool"
import commonOperate from "../../utils/common-operate"

export async function handleSelectState(
  ctx: PreCtx
) {
  const d = await preHandle(ctx)
  if(!d) return
  const { thread } = ctx
  const oldThread = valTool.copyObject(thread)

  // 1. 执行公共逻辑
  let { tipPromise } = await commonOperate.selectState(oldThread, d.memberId, d.userId)
  if(!tipPromise) return

  // 2. 等待 snackbar 的返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 发生撤销之后
  // 3. 去执行公共的取消逻辑
  await commonOperate.undoState(oldThread, d.memberId, d.userId)
}