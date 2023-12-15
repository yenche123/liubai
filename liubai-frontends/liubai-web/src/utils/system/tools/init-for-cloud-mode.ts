import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import localCache from "../local-cache"


// 具备云端模式的初始化: 
//   1. 执行 enter 流程
// 注1: 这个模式下，用户依然可以本地使用
// 注2: 该函数可供 
export async function initForCloudMode(
  store: WorkspaceStore,
) {
  const logged = localCache.hasLoginWithBackend()
  if(!logged) return false

  

  

}