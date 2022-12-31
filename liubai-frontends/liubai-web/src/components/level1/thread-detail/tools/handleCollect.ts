import dbOp from "../../utils/db-op"
import cui from "../../../custom-ui"
import type { ToidCtx } from "./types"
import { ThreadShow } from "../../../../types/types-content"
import valTool from "../../../../utils/basic/val-tool"
import commonOperate from "../../utils/common-operate"

export function handleCollect(ctx: ToidCtx) {
  check(ctx)
}


// 1. 检测数据是否正常、有没有权限
async function check(ctx: ToidCtx) {
  
  const { thread, wStore, userId } = ctx
  const { memberId, workspace } = wStore

  if(!userId) {
    const res1 = await cui.showModal({
      title_key: "tip.not_login_yet",
      content_key: "tip.login_first",
      confirm_key: "common.login"
    })
    if(res1.confirm) {
      console.log("跑去登錄頁........")
    }
    return
  }

  
  if(thread.workspace === "ME") {
    // 动态属于 个人工作区 时

    if(thread.user_id !== userId) {
      console.warn("不能收藏别人的个人工作区动态")
      return
    }
  }
  else {
    // 动态属于 协作工作区 时

    // 工作区与当前不一致
    if(thread.workspace !== workspace) {
      cui.showModal({
        title_key: "tip.tip",
        content_key: "tip.workspace_different",
        showCancel: false
      })
      return
    }
    
    // 尚未加到该工作区里
    if(!memberId || memberId !== thread.member_id) {
      const res2 = await cui.showModal({
        title_key: "tip.tip",
        content_key: "tip.not_join_bd",
        confirm_key: "tip.to_join"
      })
      if(res2.confirm) {
        // 跳转到去加入
        console.log("待完善: 跳转到去加入该工作区......")
      }
      return
    }
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

