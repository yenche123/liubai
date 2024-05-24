// Function Name: clock-half-hr
// 定时系统: 每 30 分钟执行一次
// 清理过期的 cloud.shared 全局缓存
import cloud from '@lafjs/cloud'
import type { 
  Shared_LoginState, 
  Shared_TokenUser,
} from "@/common-types"
import { getNowStamp, MINUTE } from "@/common-time"

const MIN_10 = 10 * MINUTE
const MIN_15 = 15 * MINUTE

export async function main(ctx: FunctionContext) {

  // console.log("---------- Start 清理缓存程序 ----------")
  clearLoginState()
  clearTokenUser()
  // console.log("---------- End 清理缓存程序 ----------")

  return true
}


/** 清理 liu-login-state 字段的 map */
function clearLoginState() {
  const gShared = cloud.shared
  const loginState: Map<string, Shared_LoginState> = gShared.get('liu-login-state')
  if(!loginState) {
    // console.log("liu-login-state 不存在，无需清理")
    // console.log(" ")
    return true
  }

  const size1 = loginState.size
  // console.log(`清理 loginState 前的 size: ${size1}`)

  const now = getNowStamp()
  loginState.forEach((val, key) => {
    const diff = now - val.createdStamp
    if(diff < MIN_10) return
    loginState.delete(key)
  })

  const size2 = loginState.size
  // console.log(`清理 loginState 后的 size: ${size2}`)
  // console.log(" ")

  return true
}


/** 清理 liu-token-user 字段的 map */
function clearTokenUser() {
  const gShared = cloud.shared
  const tokenUser: Map<string, Shared_TokenUser> = gShared.get('liu-token-user')
  if(!tokenUser) {
    // console.log("liu-token-user 不存在，无需清理")
    // console.log(" ")
    return true
  }

  const size1 = tokenUser.size
  // console.log(`清理 tokenUser 前的 size: ${size1}`)

  const now = getNowStamp()
  tokenUser.forEach((val, key) => {
    const diff = now - val.lastSet
    if(diff < MIN_15) return
    tokenUser.delete(key)
  })

  const size2 = tokenUser.size
  // console.log(`清理 tokenUser 后的 size: ${size2}`)
  // console.log(" ")

  return true
}