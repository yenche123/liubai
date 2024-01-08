
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { initSpace } from "./tools/init-space"
import liuEnv from "../liu-env"
import { initCycle } from "./tools/init-cycle"
import { initForPureLocalMode } from "./tools/init-for-pure-local-mode"
import { CloudToLocal } from "../cloud/CloudToLocal"
import { LocalToCloud } from "../cloud/LocalToCloud"
import { CloudEventBus } from "../cloud/CloudEventBus"

export async function init() {
  const store = useWorkspaceStore()
  const backend = liuEnv.hasBackend()
  
  initSpace(store)
  initCycle()
  CloudEventBus.init()
  CloudToLocal.init()

  if(backend) {
    // 当前为 [登录模式]
    LocalToCloud.init()
  }
  else {
    // 当前为 [纯本地模式]
    initForPureLocalMode(store)
  }
}



