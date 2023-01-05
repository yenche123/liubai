import dbOp from "../../utils/db-op"
import cui from "../../../custom-ui"
import type { ToidCtx } from "./types"
import { ThreadShow } from "~/types/types-content"
import valTool from "~/utils/basic/val-tool"
import commonOperate from "../../utils/common-operate"
import checker from "~/utils/other/checker"

export function handleCollect(ctx: ToidCtx) {
  check(ctx)
}


// 1. 检测数据是否正常、有没有权限
async function check(ctx: ToidCtx) {
  
  const { thread } = ctx
  const { userId, modalPromise } = checker.getUserId()

  if(!userId) {
    if(modalPromise) {
      const res = await modalPromise
      if(res.confirm) {
        // 去登录
      }
    }
    return
  }

  
  const { memberId, joinPromise } = checker.getMemberId(thread)
  if(!memberId) {
    if(joinPromise) {
      const res = await joinPromise
      if(res.confirm) {
        // 去加入
      }
    }
    return
  }

  handle(thread, memberId, userId)
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

