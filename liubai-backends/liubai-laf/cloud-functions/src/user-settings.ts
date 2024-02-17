import cloud from '@lafjs/cloud'
import { 
  getStripeInstance, 
  getUserInfos, 
  updateUserInCache, 
  verifyToken,
} from '@/common-util'
import type { 
  MongoFilter,
  Table_User, 
  LiuRqReturn,
  Res_UserSettings_Enter,
  Res_UserSettings_Latest,
  Res_UserSettings_Membership,
  VerifyTokenRes,
} from '@/common-types'
import { getNowStamp, DAY } from "@/common-time"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}
  const oT = body.operateType

  const stamp1 = getNowStamp()

  const entering = oT === "enter"
  const vRes = await verifyToken(ctx, body, { entering })
  const user = vRes.userData
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }

  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "enter") {
    // 获取用户设置并记录用户访问
    res = await handle_enter(vRes)
  }
  else if(oT === "latest") {
    res = await handle_latest(vRes)
  }
  else if(oT === "membership") {
    res = await handle_membership(vRes)
  }

  const stamp2 = getNowStamp()
  const diffS = stamp2 - stamp1
  console.log(`调用 user-settings 耗时: ${diffS}ms`)

  return res
}

/** get the status of membership 
 *  so return UserSubscription
*/
async function handle_membership(
  vRes: VerifyTokenRes,
): Promise<LiuRqReturn<Res_UserSettings_Membership>> {
  let user = vRes.userData as Table_User
  const sub = user.subscription

  if(!sub || sub.isOn === "N") {
    return { code: "0000", data: {} }
  }

  const { stripe_customer_id } = user
  let update_user = false
  const uUser: Partial<Table_User> = {}
  
  // 1. check data related to stripe
  if(stripe_customer_id) {
    const cpc = sub.stripe?.customer_portal_created ?? 1
    const cpu = sub.stripe?.customer_portal_url
    const diff = getNowStamp() - (cpc * 1000)

    // if customer_portal_url is not existed
    // or customer_portal_created is over 24 hrs
    if(!cpu || diff >= DAY) {
      const cPortal = await getStripeCustomerPortal(stripe_customer_id)
      if(!cPortal) {
        return { code: "E5001", errMsg: "err happened during getStripeCustomerPortal" }
      }
      sub.stripe = {
        ...sub.stripe,
        customer_portal_created: cPortal.created,
        customer_portal_url: cPortal.url,
      }
      user.subscription = sub
      uUser.subscription = sub
      update_user = true
    }
  }

  // n. update user if needed
  if(update_user) {
    const user_id = user._id
    const col_user = db.collection("User")
    await col_user.where({ _id: user_id }).update(uUser)
    updateUserInCache(user_id, user)
  }

  return { code: "0000", data: { subscription: sub } }
}

async function getStripeCustomerPortal(
  customer: string
) {
  const stripe = getStripeInstance()
  if(!stripe) return

  const return_url = process.env.LIU_DOMAIN
  try {
    const res = await stripe.billingPortal.sessions.create({
      customer,
      return_url,
    })
    return res
  }
  catch(err) {
    console.warn("stripe.billingPortal.sessions.create err:")
    console.log(err)
  }
}



async function handle_enter(
  vRes: VerifyTokenRes,
) {
  const user = vRes.userData as Table_User

  // 1. 去获取用户基础设置
  const res1 = await getUserSettings(user)
  if(res1.code !== "0000" || !res1.data) {
    return res1
  }

  // 2. 去记录用户访问了应用
  const now = getNowStamp()
  const u: MongoFilter<Table_User> = {
    lastEnterStamp: now,
    updatedStamp: now,
  }

  // 3. 查看 verifyToken 时，是否有生成新的 token serial
  // 若有，送进回调里
  if(vRes.new_serial && vRes.new_token) {
    res1.data.new_serial = vRes.new_serial
    res1.data.new_token = vRes.new_token
  }

  const q = db.collection("User").where({ _id: user._id })
  q.update(u)
  
  return res1
}

/** get user's latest status */
async function handle_latest(
  vRes: VerifyTokenRes,
) {
  const user = vRes.userData as Table_User
  const res1 = await getUserSettings(user)
  const data = res1.data
  if(res1.code !== "0000" || !data) {
    return res1 as LiuRqReturn
  }
  const newData: Res_UserSettings_Latest = { ...data }
  const newRes: LiuRqReturn<Res_UserSettings_Latest> = {
    code: "0000",
    data: newData
  }
  return newRes
}


/**
 * 获取用户基础设置
 * 1. 登录方式，比如 email / GitHub ID 等等
 * 2. 已经加入哪些工作区，这些工作区的名称和头像
 */
async function getUserSettings(
  user: Table_User,
): Promise<LiuRqReturn<Res_UserSettings_Enter>> {
  const [ui] = await getUserInfos([user])
  if(!ui) {
    return { code: "E4004", errMsg: "it cannot find an userinfo" }
  }

  const { email, github_id, theme, language, subscription } = user
  const spaceMemberList = ui.spaceMemberList
  const data: Res_UserSettings_Enter = {
    email,
    github_id,
    theme,
    language,
    spaceMemberList,
    subscription,
  }

  return { code: "0000", data }
}

