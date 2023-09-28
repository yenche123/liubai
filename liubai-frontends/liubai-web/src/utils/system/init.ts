import { firstCreate } from "./tools/first-create"
import localCache from "./local-cache"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { initSpace } from "./tools/init-space"
import { findSystem } from "./tools/find-sytem"
import type { SpaceAndMemberOpt } from "~/hooks/stores/useWorkspaceStore"
import liuEnv from "../liu-env"
import { initCycle } from "./tools/init-cycle"

export async function init() {
  const store = useWorkspaceStore()
  const env = liuEnv.getEnv()

  initSpace(store)
  initCycle()

  // 当前为 [登录模式] 则忽略
  if(env.API_URL) {
    return
  }

  // 当前为 [纯本地模式]
  const localPf = localCache.getLocalPreference()
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
  localCache.setLocalPreference("local_id", user._id)
  
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

