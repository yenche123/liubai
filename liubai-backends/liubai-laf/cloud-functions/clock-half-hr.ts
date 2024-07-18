// Function Name: clock-half-hr
// 定时系统: 每 30 分钟执行一次
// 清理过期的 cloud.shared 全局缓存
import cloud from '@lafjs/cloud'
import type { 
  Shared_LoginState, 
  Shared_TokenUser,
  Table_Credential,
} from "@/common-types"
import { getNowStamp, MINUTE } from "@/common-time"
import { getWwQynbAccessToken, liuReq } from '@/common-util'

const db = cloud.database()
const _ = db.command

const MIN_20 = 20 * MINUTE
const MIN_15 = 15 * MINUTE

const API_WECOM_DEL_CONTACT_WAY = "https://qyapi.weixin.qq.com/cgi-bin/externalcontact/del_contact_way"

export async function main(ctx: FunctionContext) {

  // console.log("---------- Start 清理缓存程序 ----------")
  clearBindWecom()
  clearLoginState()
  clearTokenUser()
  // console.log("---------- End 清理缓存程序 ----------")
  // console.log(" ")

  return true
}

/** to clear credentials about `bind-wecom` */
async function clearBindWecom() {
  const MIN_15_AGO = getNowStamp() - MIN_15

  // 1. get credentials
  const col = db.collection("Credential")
  const w1 = {
    infoType: "bind-wecom",
    expireStamp: _.lt(MIN_15_AGO),
  }
  const res1 = await col.where(w1).get<Table_Credential>()
  const d1 = res1.data
  if(d1.length < 1) {
    return true
  }

  // 2. get accessToken for wecom
  const accessToken = await getWwQynbAccessToken()
  if(!accessToken) {
    console.warn("accessToken for wecom is not found")
    return false
  }

  // 3. get link of deleting contact way on wecom
  const url = new URL(API_WECOM_DEL_CONTACT_WAY)
  const sP = url.searchParams
  sP.set("access_token", accessToken)
  const link = url.toString()
  
  for(let i=0; i<d1.length; i++) {

    // 4. delete contact way
    const c4 = d1[i]
    const config_id = c4.meta_data?.ww_qynb_config_id
    if(!config_id) continue

    console.log("request to delete contact way: ", config_id)
    const res4 = await liuReq(link, { config_id })

    console.log("result 4: ")
    console.log(res4)

    // 5. delete the credential
    const res5 = await col.doc(c4._id).remove()
    console.log("result 5: ")
    console.log(res5)
  }

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
    if(diff < MIN_20) return
    loginState.delete(key)
  })

  const size2 = loginState.size
  // console.log(`清理 loginState 后的 size: ${size2}`)

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

  return true
}