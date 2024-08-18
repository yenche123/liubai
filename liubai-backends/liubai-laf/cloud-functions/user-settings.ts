// Function Name: user-settings

import cloud from '@lafjs/cloud'
import { 
  checker,
  getLiuTokenUser,
  getStripeInstance, 
  getUserInfos, 
  updateUserInCache, 
  verifyToken,
} from '@/common-util'
import { 
  type MongoFilter,
  type Table_User, 
  type LiuRqReturn,
  type Res_UserSettings_Enter,
  type Res_UserSettings_Latest,
  type Res_UserSettings_Membership,
  type VerifyTokenRes_B,
  type Table_Token,
  Sch_LocalTheme,
  Sch_LocalLocale,
} from '@/common-types'
import { getNowStamp, DAY } from "@/common-time"
import * as vbot from "valibot"
import { getCurrentLocale } from '@/common-i18n'
import {
  tag_user_lang as wx_gzh_tag_user_lang,
} from "@/webhook-wechat"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}
  const oT = body.operateType

  let res: LiuRqReturn = { code: "E4000" }

  // 0. if it is logout, bypass the verification
  if(oT === "logout") {
    res = await handle_logout(ctx, body)
    return res
  }


  const stamp1 = getNowStamp()
  const entering = oT === "enter"
  const vRes = await verifyToken(ctx, body, { entering })
  if(!vRes.pass) return vRes.rqReturn

  if(oT === "enter") {
    // 获取用户设置并记录用户访问
    res = await handle_enter(ctx, vRes)
  }
  else if(oT === "latest") {
    res = await handle_latest(vRes)
  }
  else if(oT === "membership") {
    res = await handle_membership(vRes)
  }
  else if(oT === "set") {
    res = await handle_set(vRes, body)
  }

  const stamp2 = getNowStamp()
  const diffS = stamp2 - stamp1
  // console.log(`调用 user-settings 耗时: ${diffS}ms`)

  return res
}


async function handle_logout(
  ctx: FunctionContext,
  body: Record<string, string>,
): Promise<LiuRqReturn> {
  const token = body["x_liu_token"]
  const serial_id = body["x_liu_serial"]

  if(!token || !serial_id) {
    return {
      code: "E4000",
      errMsg: "token, serial_id are required", 
    }
  }

  // 1. get token data
  const col = db.collection("Token")
  const res = await col.doc(serial_id).get<Table_Token>()
  const d = res.data

  // checking out if it exists
  if(!d) {
    return {
      code: "E4003",
      errMsg: "token not found",
    }
  }

  // checking out the token
  const _token = d.token
  if(_token !== token) {
    return {
      code: "E4003",
      errMsg: "your token is wrong",
    }
  }

  // 2. remove for db
  const res2 = await col.where({ _id: serial_id }).remove()

  // 3. remove for cache
  const map = getLiuTokenUser()
  map.delete(serial_id)

  return { code: "0000" }
}


async function handle_set(
  vRes: VerifyTokenRes_B,
  body: Record<string, any>,
): Promise<LiuRqReturn> {

  // 1. check inputs
  const Sch_Set = vbot.object({
    theme: vbot.optional(Sch_LocalTheme),
    language: vbot.optional(Sch_LocalLocale),
  })
  const res1 = vbot.safeParse(Sch_Set, body)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg }
  }

  // 2. return err if both theme and language are empty
  const { theme, language } = res1.output
  if(!theme && !language) {
    return { code: "E4000", errMsg: "nothing to update" }
  }

  let updated = false
  const user = vRes.userData
  const u: Partial<Table_User> = {}

  // 3. update theme
  if(theme && theme !== user.theme) {
    updated = true
    u.theme = theme
  }

  // 4. update language
  if(language && language !== user.language) {
    updated = true
    u.language = language

    // 4.1 update on wechat gzh
    const oldLocale = getCurrentLocale({ user })
    const openid = user.wx_gzh_openid
    const tmpUser4 = { ...user, language }
    if(openid) {
      wx_gzh_tag_user_lang(openid, tmpUser4, undefined, oldLocale)
    }
  }

  // 5. return if no update
  if(!updated) {
    return { code: "0000" }
  }

  u.updatedStamp = getNowStamp()

  // 6. to update in db
  const userId = user._id
  const col_user = db.collection("User")
  const res6 = await col_user.doc(userId).update(u)
  console.log("update user's theme & lang")
  console.log(res6)

  // 7. update in cache
  const newUser = { ...user, ...u }
  updateUserInCache(userId, newUser)

  return { code: "0000" }
}


/** get the status of membership 
 *  so return UserSubscription
*/
async function handle_membership(
  vRes: VerifyTokenRes_B,
): Promise<LiuRqReturn<Res_UserSettings_Membership>> {
  let user = vRes.userData
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

  let return_url = process.env.LIU_DOMAIN
  if(return_url) {
    return_url += `/subscription`
  }

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
  ctx: FunctionContext,
  vRes: VerifyTokenRes_B,
): Promise<LiuRqReturn<Res_UserSettings_Enter>> {
  // 0. get some params
  const user = vRes.userData
  const userAgent = ctx.headers?.['user-agent']
  const body = ctx.request?.body ?? {}
  const userTimezone = body.x_liu_timezone 

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
    userAgent,
  }
  if(userTimezone !== user.timezone) {
    u.timezone = userTimezone
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
  vRes: VerifyTokenRes_B,
) {
  const user = vRes.userData
  const res1 = await getUserSettings(user)
  const data = res1.data
  if(res1.code !== "0000" || !data) {
    return res1 as LiuRqReturn<Res_UserSettings_Latest>
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

  const { 
    email, 
    open_id,
    github_id, 
    theme, 
    language, 
    subscription,
  } = user
  const spaceMemberList = ui.spaceMemberList
  const data: Res_UserSettings_Enter = {
    email,
    open_id,
    github_id,
    theme,
    language,
    spaceMemberList,
    subscription,
  }

  return { code: "0000", data }
}

