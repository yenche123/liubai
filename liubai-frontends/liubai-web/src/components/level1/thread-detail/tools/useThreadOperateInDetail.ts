import type {
  ThreadOperation
} from "../../thread-list/tools/types"
import type { ThreadShow } from "../../../../types/types-content"
import type { ThreadShowStore } from "../../../../hooks/stores/useThreadShowStore"
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore"
import { useThreadShowStore } from "../../../../hooks/stores/useThreadShowStore"
import { getLocalPreference } from "../../../../utils/system/local-preference"
import dbOp from "../../thread-list/tools/db-op"
import cui from "../../../custom-ui"
import type { TdData } from "./useThreadDetail"
import type { WorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore"
import { useRouteAndLiuRouter } from "../../../../routes/liu-router"
import type { RouteAndLiuRouter } from "../../../../routes/liu-router"

interface ToidCtx {
  tsStore: ThreadShowStore
  thread: ThreadShow
  wStore: WorkspaceStore
  userId?: string
  tdData: TdData
  rr: RouteAndLiuRouter
}

export function useThreadOperateInDetail(
  tdData: TdData,
) {
  const wStore = useWorkspaceStore()
  const tsStore = useThreadShowStore()
  const rr = useRouteAndLiuRouter()

  const receiveOperation = (
    operation: ThreadOperation, 
    position: number, 
    thread: ThreadShow
  ) => {
    const { local_id: userId } = getLocalPreference()

    const ctx: ToidCtx = {
      tsStore,
      thread,
      wStore,
      userId,
      tdData,
      rr
    }

    if(operation === "collect") {
      handle_collect(ctx)
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

async function handle_collect(ctx: ToidCtx) {
  // 检测有没有权限
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



}