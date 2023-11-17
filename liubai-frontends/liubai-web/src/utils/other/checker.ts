// 执行一些操作之前的前置操作，比如获取 userId / memberId 等等的

import cui from "~/components/custom-ui"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { ThreadShow } from "~/types/types-content"
import { LiuMyContext } from "~/types/types-context"
import localCache from "~/utils/system/local-cache"

interface CheckerParam {
  showTip?: boolean        // 如果不存在 登录态 时，是否展示弹窗提示
}

// 获取 userId
const getUserId = (
  opt: CheckerParam = {}
) => {
  opt.showTip = opt.showTip ?? true

  const { local_id: userId } = localCache.getPreference()
  if(!userId) {
    if(opt.showTip) {
      const res = cui.showModal({
        title_key: "tip.not_login_yet",
        content_key: "tip.login_first",
        confirm_key: "common.login"
      })
      return { userId: "", modalPromise: res }
    }
    return { userId: "" }
  }

  return { userId }
}

// 获取我的上下文: userId / memberId / spaceId / spaceType
const getMyContext = (
  opt: CheckerParam = {}
): LiuMyContext | undefined => {
  opt.showTip = opt.showTip ?? true

  const { local_id: userId } = localCache.getPreference()
  if(!userId) {
    if(opt.showTip) {
      const res = cui.showModal({
        title_key: "tip.not_login_yet",
        content_key: "tip.login_first",
        confirm_key: "common.login"
      })
      return
    }
    return
  }

  const wStore = useWorkspaceStore()
  const { memberId, spaceId, spaceType } = wStore
  if(!memberId || !spaceId || !spaceType) {
    if(opt.showTip) {
      const res = cui.showModal({
        title_key: "tip.tip",
        content_key: "tip.no_context",
        showCancel: false,
      })
      return
    }
    return
  }

  return { userId, memberId, spaceId, spaceType }
}

// 除了获取 memberId 还有一个很重要的用途是判别权限
const getMemberId = (
  thread: ThreadShow,
  opt: CheckerParam = {}
) => {
  opt.showTip = opt.showTip ?? true

  const wStore = useWorkspaceStore()
  const { memberId, spaceId, spaceType } = wStore

  
  if(spaceType === "ME") {
    // 个人工作区
    if(!memberId || !thread.isMine) {
      if(opt.showTip) cui.showSnackBar({ text_key: "tip.no_auth" })
      return { memberId: "" }
    }
  }
  else {
    // 协作工作区

    // 工作区与当前不一致
    if(thread.spaceId !== spaceId) {
      if(opt.showTip) {
        cui.showModal({
          title_key: "tip.tip",
          content_key: "tip.workspace_different",
          showCancel: false
        })
      }
      return { memberId: "" }
    }

    // 尚未加到该工作区里
    if(!memberId || memberId !== thread.member_id) {
      if(!opt.showTip) {
        return { memberId: "" }
      }
      const res2 = cui.showModal({
        title_key: "tip.tip",
        content_key: "tip.not_join_bd",
        confirm_key: "tip.to_join"
      })
      return { memberId: "", joinPromise: res2 }
    }

  }


  return { memberId }
}


export default {
  getUserId,
  getMyContext,
  getMemberId,
}