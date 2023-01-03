// 执行一些操作之前的前置操作，比如获取 userId / memberId 等等的

import cui from "../../components/custom-ui"
import { useWorkspaceStore } from "../../hooks/stores/useWorkspaceStore"
import { ThreadShow } from "../../types/types-content"
import { getLocalPreference } from "../system/local-preference"

interface GetUParam {
  showTip?: boolean        // 如果不存在 userId 时，是否展示弹窗提示
}

const getUserId = (
  opt: GetUParam = {}
) => {
  opt.showTip = opt.showTip ?? true

  const { local_id: userId } = getLocalPreference()
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

interface GetMParam {
  showTip?: boolean        // 如果不存在 userId 时，是否展示弹窗提示
}

// 除了获取 memberId 还有一个很重要的用途是判别权限
const getMemberId = (
  thread: ThreadShow,
  opt: GetMParam = {}
) => {
  opt.showTip = opt.showTip ?? true

  const wStore = useWorkspaceStore()
  const { workspace, memberId } = wStore

  
  if(thread.workspace === "ME") {
    // 个人工作区
    if(!memberId || memberId !== thread.member_id) {
      // 显示没有权限
      if(opt.showTip) cui.showSnackBar({ text_key: "tip.no_auth" })
      return { memberId: "" }
    }
  }
  else {
    // 协作工作区

    // 工作区与当前不一致
    if(thread.workspace !== workspace) {
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
  getMemberId,
}