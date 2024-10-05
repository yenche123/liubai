import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import time from "~/utils/basic/time"
import localCache from "~/utils/system/local-cache";

const SEC_3 = 3 * time.SECONED
let lastLogoutStamp = 0

interface LogoutOpt {
  cloud?: boolean
}

export function logout(
  rr: RouteAndLiuRouter,
  opt?: LogoutOpt,
) {

  // 0. 防抖节流，3s内进来过，忽略
  if(time.isWithinMillis(lastLogoutStamp, SEC_3)) return

  // 1. 去判断是否远端退出
  if(opt?.cloud) {
    // TODO: 去调用远端退出登录
  }

  // 2. 删除 local-cache
  const p = localCache.getPreference()
  delete p.client_key
  delete p.local_id
  delete p.open_id
  delete p.serial
  delete p.token
  delete p.loadEditStamp
  delete p.loginStamp
  localCache.setAllPreference(p)

  // 3. 删除 workspace store
  const wStore = useWorkspaceStore()
  wStore.logout()

  // 4. 路由到 login
  rr.router.replace({ name: "login" })

  // n. 赋值
  lastLogoutStamp = time.getTime()
}