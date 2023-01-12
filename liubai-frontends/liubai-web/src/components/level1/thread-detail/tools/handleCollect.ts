import type { ToidCtx } from "./types"
import { ThreadShow } from "~/types/types-content"
import valTool from "~/utils/basic/val-tool"
import commonOperate from "../../utils/common-operate"
import { preHandle } from "./preHandle"

// 1. 开始执行，去获取前置数据
export async function handleCollect(ctx: ToidCtx) {
  const { thread } = ctx
  const data = await preHandle(ctx)
  if(!data) return
  handle(thread, data.memberId, data.userId)
}

// 2. 开始执行逻辑
async function handle(thread: ThreadShow, memberId: string, userId: string) {
  const oldThread = valTool.copyObject(thread)

  // 1. 执行公共逻辑
  const { tipPromise } = await commonOperate.toCollect(oldThread, memberId, userId)

  // 2. 等待 snackbar 的 promise
  const res2 = await tipPromise
  if(res2.result !== "tap") return

  // 发生撤销之后
  // 3. 去执行公共的取消逻辑
  await commonOperate.undoCollect(oldThread, memberId, userId)
}

