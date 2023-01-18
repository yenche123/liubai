import type { PreCtx } from "./tools/types"
import checker from "~/utils/other/checker"

// 前置检查，若都正常则返回 memberId 和 userId
export async function preHandle(ctx: PreCtx) {

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

  return { userId, memberId }
}