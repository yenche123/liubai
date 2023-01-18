import type { PreCtx } from "../../utils/tools/types"
import { preHandle } from "../../utils/preHandle"
import valTool from "~/utils/basic/val-tool"
import commonOperate from "../../utils/common-operate"

export async function handleDelete(
  ctx: PreCtx
) {
  const d = await preHandle(ctx)
  if(!d) return
  const { thread } = ctx
  const oldThread = valTool.copyObject(thread)

  // 1. 执行公共逻辑
  const { tipPromise } = await commonOperate.deleteThread(oldThread, d.memberId, d.userId)

  // 2. 等待 snackbar 的返回
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 发生撤销之后
  // 3. 去执行公共的取消逻辑
  await commonOperate.undoDelete(oldThread, d.memberId, d.userId)
}

// 恢复
export async function handleRestore(
  ctx: PreCtx
) {
  const d = await preHandle(ctx)
  if(!d) return

  const { thread } = ctx
  const oldThread = valTool.copyObject(thread)

  // 1. 执行 restore 公共逻辑
  const res = await commonOperate.restoreThread(oldThread, d.memberId, d.userId)
}

// 彻底删除
export async function handleDeleteForever(
  ctx: PreCtx
) {
  const d = await preHandle(ctx)
  if(!d) return
  const { thread } = ctx
  const oldThread = valTool.copyObject(thread)

  // 1. 执行 彻底删除 公共逻辑
  const res = await commonOperate.deleteForever(oldThread, d.memberId, d.userId)
}