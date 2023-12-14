import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { firstCreate } from "./first-create"
import localCache from "../local-cache"
import { findSystem } from "./find-sytem"
import type { SpaceAndMemberOpt } from "~/hooks/stores/useWorkspaceStore"

// 纯本地模式的初始化
export async function initForPureLocalMode(
  store: WorkspaceStore,
) {
  const localPf = localCache.getPreference()
  if(localPf.local_id) {
    // 【待完善】去修改 User 表里的 lastRefresh
    const isOk = await findSystem(localPf.local_id)
    if(isOk) {
      // console.log("万事 Ok！")
      return
    }
  }

  // 去创建 user / workspace / member
  let createData = await firstCreate()
  if(!createData) return
  const { workspace, member, user } = createData
  localCache.setPreference("local_id", user._id)
  
  const opt: SpaceAndMemberOpt = {
    spaceId: workspace._id,
    memberId: member._id,
    isCollaborative: false,
    currentSpace: workspace,
    myMember: member
  }
  store.setMySpaceIds([workspace._id])
  store.setSpaceAndMember(opt)
}