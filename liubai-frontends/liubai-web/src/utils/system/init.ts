import liuUtil from "../liu-util"
import { firstCreate } from "./tools/first-create"
import { getLocalPreference, setLocalPreference } from "./local-preference"
import { useWorkspaceStore } from "../../hooks/stores/useWorkspaceStore"
import { initSpace } from "./tools/init-space"

export async function init() {
  const store = useWorkspaceStore()
  const env = liuUtil.getEnv()

  // 当前为登录模式，则忽略
  if(env.API_URL) {
    initSpace(store)
    return
  }

  const localPf = getLocalPreference()
  if(localPf.local_id) {
    // 【待完善】去修改 User 表里的 lastRefresh
    // 【待完善】去初始化 workspace id
    initSpace(store)
    return
  }

  // 去创建 user / workspace / member
  let createData = await firstCreate()
  if(!createData) return
  setLocalPreference("local_id", createData.user_local)
  store.setSpace(createData.workspace_local)
}

