import cloud from "@lafjs/cloud";
import Stripe from "stripe";
import { verifyToken, getIpArea, getDocAddId } from '@/common-util';
import type { 
  Table_Subscription, 
  Table_User,
  Res_SubPlan_Info,
  Res_SubPlan_StripeCheckout,
  LiuRqReturn,
  Table_Credential,
  Table_Order,
} from "@/common-types";
import { 
  getBasicStampWhileAdding, 
  getNowStamp, 
  MINUTE,
  HOUR,
  WEEK,
} from "@/common-time";


const db = cloud.database()

/** some constants */
const MIN_30 = MINUTE * 30
const HOUR_3 = HOUR * 3

// stripe 的取消订阅，交由 stripe 托管的收据页面去管理
// 应用负责接收 webhook 再去修改订阅信息

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}

  // 1. 验证 token
  const vRes = await verifyToken(ctx, body)
  const user = vRes.userData
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }

  const oT = body.operateType
  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "info") {
    res = await handle_info(ctx)
  }
  else if(oT === "create_stripe") {
    res = await handle_create_stripe(body, user)
  }
  else if(oT === "cancel_subscription") {
    handle_cancel_subscription(body, user)
  }

  return res
}

/** 取消订阅 
 * 超过 7 天（鉴赏期）时，由于不需要退款，所以
 * 引导用户到 stripe 托管的页面去取消（管理）订阅
 * 在鉴赏期内，才引导用户在应用内点击 “取消订阅” 再向该接口发起请求
*/
async function handle_cancel_subscription(
  body: Record<string, string>,
  user: Table_User, 
) {

  // 1. check user's subscription
  const hasSubscribed = checkIfUserSubscribed(user)
  const sub = user.subscription
  if(!hasSubscribed || !sub) {
    return { code: "SP006", errMsg: "the user has not subscribed currently" }
  }

  // 2. check if subscription is within 7 days
  const s1 = sub.firstChargedStamp ?? 1
  const now = getNowStamp()
  const isInAWeek = (now - s1) < WEEK
  const chargeTimes = sub.chargeTimes ?? 1
  if(isInAWeek && chargeTimes <= 1) {
    await toRefundAndCancel(user)
  }

  await toCancelWhenThePeriodEnd(user)
}

/** 只去取消订阅 */
async function toCancelWhenThePeriodEnd(
  user: Table_User,
) {
  
}


/** 退款再取消
 *  1. 查找订单
 *  2. 发起退款
 *  3. 发起立即取消订阅
 */
async function toRefundAndCancel(
  user: Table_User,
) {
  const w: Partial<Table_Order> = {
    user_id: user._id,
    oState: "OK",
    orderType: "subscription",
  }
  const col_order = db.collection("Order")
  const q1 = col_order.where(w).orderBy("insertedStamp", "desc")
  const res1 = await q1.getOne<Table_Order>()
  const theOrder = res1.data

  // to cancel while the period ends if no order
  if(!theOrder) {
    toCancelWhenThePeriodEnd(user)
    return
  }
  const { payChannel, paidAmount, refundedAmount, stripe_charge_id } = theOrder
  if(refundedAmount < paidAmount) {
    const refundAmt = paidAmount - refundedAmount
    if(payChannel === "stripe" && stripe_charge_id) {
      requestStripeToRefund(refundAmt, stripe_charge_id)
    }
  }

}

async function requestStripeToRefund(
  refundAmt: number,
  stripe_charge_id: string,
) {


}


/** 获取订阅方案的消息 */
async function handle_info(
  ctx: FunctionContext,
) {
  const col = db.collection("Subscription")
  const res = await col.where({ isOn: "Y" }).getOne<Table_Subscription>()

  const d = res.data
  if(!d) return { code: "E4004" }

  let currency = getSupportedCurrency(ctx)

  //@ts-ignore price
  let price: string | undefined = d[`price_${currency}`]
  if(!price) {
    price = d.price_USD
    if(!price) {
      return { code: "E4004", errMsg: "there is no currency matched" }
    }
    currency = "USD"
  }

  const r: Res_SubPlan_Info = {
    id: d._id,
    payment_circle: d.payment_circle,
    badge: d.badge,
    title: d.title,
    desc: d.desc,
    stripe: d.stripe,
    price,
    currency,
  }
  
  return { code: "0000", data: r }
}

/** [Warning]: 待确认
 *  Get the currency based on ip
 */
function getSupportedCurrency(
  ctx: FunctionContext,
) {
  const area = getIpArea(ctx)
  let c = "USD"
  if(!area) return c

  if(area === "AU") {
    c = "AUD"
  }
  else if(area === "CN") {
    c = "CNY"
  }
  else if(area === "JP") {
    c = "JPY"
  }
  else if(area === "NZ") {
    c = "NZD"
  }
  else if(area === "TW") {
    c = "TWD"
  }

  return c
}

/** check if the user's subscription is currently active */
function checkIfUserSubscribed(
  user: Table_User,
) {
  const s = user.subscription
  const isOn = s?.isOn
  if(!s || !isOn) return false
  const isLifelong = s.isLifelong
  if(isLifelong) return true
  const expireStamp = s.expireStamp ?? 1
  const now = getNowStamp()
  const diff = expireStamp - now
  if(diff > 0) return true
  return false
}

function checkIfUserCanBindStripe(
  user: Table_User,
) {
  const s = user.subscription
  const isOn = s?.isOn
  if(!s || !isOn) return true
  const isLifelong = s.isLifelong
  if(isLifelong) return false
  const { autoRecharge, expireStamp = 0 } = s
  if(!autoRecharge) return true

  // if the expiration has not been reached
  const diff = expireStamp - getNowStamp()
  if(diff > 0) return false

  return true
}


/** 创建 stripe checkout session */
async function handle_create_stripe(
  body: Record<string, string>,
  user: Table_User,
): Promise<LiuRqReturn<Res_SubPlan_StripeCheckout>> {

  // 1. 参数是否齐全
  const useTimezone = body.x_liu_timezone
  const subscription_id = body.subscription_id
  if(!subscription_id || typeof subscription_id !== "string") {
    return { code: "E4000", errMsg: "subscription_id is required" }
  }
  const _env = process.env
  const { LIU_DOMAIN, LIU_STRIPE_API_KEY } = _env
  if(!LIU_DOMAIN) {
    return { code: "E5001", errMsg: "there is no domain in env" }
  }
  if(!LIU_STRIPE_API_KEY) {
    return { code: "E5001", errMsg: "no stripe api key" }
  }

  // 2. 去查看 user 是否已经订阅，并且有效
  const canBind = checkIfUserCanBindStripe(user)
  if(!canBind) {
    return { code: "SP001", errMsg: "there is no need to bing stripe" }
  }

  // 3. check Credential for old session
  const w1: Partial<Table_Credential> = {
    infoType: "stripe-checkout-session",
    userId: user._id,
  }
  const col_cred = db.collection("Credential")
  const q1 = col_cred.where(w1).orderBy("expireStamp", "desc")
  const res_1 = await q1.getOne<Table_Credential>()
  const data_1 = res_1.data
  
  const now1 = getNowStamp()
  const e1 = data_1?.expireStamp ?? 1
  const diff_1 = e1 - now1
  const url_1 = data_1?.stripeCheckoutSession?.url
  // use old session if the duration between now and the expireStamp 
  // is more than 30 mins
  if(url_1 && diff_1 > MIN_30) {
    const r1: Res_SubPlan_StripeCheckout = {
      checkout_url: url_1,
    }
    return { code: "0000", data: r1 }
  }

  // 4. 查询 Subscription
  const col_sub = db.collection("Subscription")
  const res2 = await col_sub.doc(subscription_id).get<Table_Subscription>() 
  const data_2 = res2.data
  if(!data_2) {
    return { code: "E4004", errMsg: "the subscription cannot be found" }
  }
  if(data_2.isOn !== "Y") {
    return { code: "E4004", errMsg: "the subscription is not available" }
  }

  // 5. check parameters of Subscription
  const stripeData = data_2.stripe
  const stripeIsOn = stripeData?.isOn
  const stripePriceId = stripeData?.price_id
  if(stripeIsOn !== "Y") {
    return { code: "SP002", errMsg: "the payment of stripe is not available" }
  }
  if(!stripePriceId) {
    return { code: "E5001", errMsg: "there is no price_id of stripe" }
  }
  
  // set expires_at as 3 hours later
  const expires_at = Math.round((getNowStamp() + HOUR_3) / 1000)

  // set billing_cycle_anchor
  let subscription_data: Stripe.Checkout.SessionCreateParams.SubscriptionData | undefined
  const billing_cycle_anchor = getBillingCycleAnchor(user)
  if(billing_cycle_anchor) {
    subscription_data = {
      billing_cycle_anchor,
      proration_behavior: "none"
    }
  }

  const stripe = new Stripe(LIU_STRIPE_API_KEY)
  let session: Stripe.Response<Stripe.Checkout.Session>
  try {
    session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        }
      ],
      mode: 'subscription',
      success_url: `${LIU_DOMAIN}/payment-success`,
      cancel_url: `${LIU_DOMAIN}/payment-cancel`,
      automatic_tax: { enabled: true },
      expires_at,
      subscription_data,
    })
  }
  catch(err) {
    console.warn("Err while creating checkout session on stripe......")
    console.log(err)
    return { code: "SP003" }
  }

  console.log("take a look of session: ")
  console.log(session)
  console.log(" ")
  const url_2 = session.url
  const session_id = session.id
  const expireStamp = session.expires_at * 1000
  if(!url_2) {
    return { code: "SP004", errMsg: "no session.url" }
  }

  // 6. create Credential
  const b1 = getBasicStampWhileAdding()
  const cred: Omit<Table_Credential, "_id"> = {
    ...b1,
    credential: session_id,
    infoType: "stripe-checkout-session",
    expireStamp,
    stripeCheckoutSession: session,
    meta_data: {
      payment_circle: data_2.payment_circle,
      payment_timezone: useTimezone,
      plan: subscription_id,
    },
  }
  const res3 = await col_cred.add(cred)
  const newCredId = getDocAddId(res3)
  if(!newCredId) {
    return { code: "SP005", errMsg: "Err while creating credential" }
  }

  const r1: Res_SubPlan_StripeCheckout = {
    checkout_url: url_2,
  }

  return { code: "0000", data: r1 }
}

/** get the active expireStamp of the user's subscription 
 *  return undefined if the expireStamp is within 3 hrs
 *  return undefined if the expireStamp is in the past
 *  return undefined if the subscription's isOn is "N"
 *  return undefined if isLifelong is true
 *  otherwise return billing_cycle_anchor (second)
*/
function getBillingCycleAnchor(
  user: Table_User,
) {
  const s = user.subscription
  const isOn = s?.isOn
  if(!isOn || isOn === "N") return
  const isLifelong = s?.isLifelong
  if(isLifelong) return
  const now = getNowStamp()
  const e = s?.expireStamp ?? 1
  const diff = e - now
  if(diff < HOUR_3) return
  const b = Math.round(e / 1000)
  return b
}

