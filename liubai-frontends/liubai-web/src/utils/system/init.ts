
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { initSpace } from "./tools/init-space"
import liuEnv from "../liu-env"
import { initCycle } from "./tools/init-cycle"
import { initForCloudMode } from "./tools/init-for-cloud-mode"
import { initForPureLocalMode } from "./tools/init-for-pure-local-mode"
import { useUserEnterStore } from "~/hooks/stores/cloud/useUserEnterStore"

export async function init() {
  const store = useWorkspaceStore()
  const backend = liuEnv.hasBackend()
  
  initSpace(store)
  initCycle()

  if(backend) {
    // 当前为 [登录模式]
    initForCloudMode(store)
    useUserEnterStore()
  }
  else {
    // 当前为 [纯本地模式]
    initForPureLocalMode(store)
  }
}



