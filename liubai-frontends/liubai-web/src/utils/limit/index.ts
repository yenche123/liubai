import type { LiuLimit } from "~/types/types-atom"
import liuUtil from "../liu-util"

function getMode() {
  const env = liuUtil.getEnv()
  if(env.API_URL) return "online"
  return "pure_local"
}


// 返回当前用户对该功能的使用限制（number）
// 返回 -1 代表没有限制
function getLimit(val: LiuLimit) {
  // 获取模式
  const mode = getMode()

  //【待完善】获取我是否付费
  const isPaid = false        // 先写死，代表还没付费

  const env = liuUtil.getEnv()

  if(val === "pin") {
    if(mode === "pure_local") return env.LOCAL_PIN_NUM
    if(isPaid) return env.PREMIUM_PIN_NUM
    return env.FREE_PIN_NUM
  }
  else if(val === "thread") {
    if(mode === "pure_local") return -1
    if(!isPaid) return env.FREE_THREAD_NUM
  }
  else if(val === "workspace") {
    if(mode === "pure_local") return env.LOCAL_WORKSPACE_NUM
    if(isPaid) return env.PREMIUM_WORKSPACE_NUM
    return env.FREE_WORKSPACE_NUM
  }

  return -1
}


export default {
  getMode,
  getLimit,
}