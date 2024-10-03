// Function Name: subscribe-plan

import cloud from "@lafjs/cloud";
import Stripe from "stripe";
import { 
  verifyToken, 
  getIpArea, 
  getDocAddId,
  checkIfUserSubscribed,
  LiuStripe,
  WxpayHandler,
  updateUserInCache,
  getCurrencySymbol,
  AlipayHandler,
} from '@/common-util';
import type { 
  Table_Subscription, 
  Table_User,
  Res_SubPlan_Info,
  Res_SubPlan_StripeCheckout,
  LiuRqReturn,
  Table_Credential,
  Table_Order,
  Wxpay_Refund_Custom_Param,
  Alipay_Refund_Param,
} from "@/common-types";
import { 
  getBasicStampWhileAdding,
  getNowStamp,
  MINUTE,
  HOUR,
  WEEK,
  SECONED,
} from "@/common-time";
import { createRefundNo } from "@/common-ids";
import { useI18n, subPlanLang } from "@/common-i18n";

const db = cloud.database()

/** some constants */
const SEC_5 = SECONED * 5
const MIN_30 = MINUTE * 30
const HOUR_3 = HOUR * 3

// stripe 的取消订阅，交由 stripe 托管的收据页面去管理
// 应用负责接收 webhook 再去修改订阅信息

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}

  // 1. 验证 token
  const vRes = await verifyToken(ctx, body)
  if(!vRes.pass) return vRes.rqReturn
  const user = vRes.userData

  const oT = body.operateType
  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "info") {
    res = await handle_info(ctx)
  }
  else if(oT === "create_stripe") {
    res = await handle_create_stripe(body, user)
  }
  else if(oT === "cancel_and_refund") {
    res = await handle_cancel_and_refund(body, user)
  }

  return res
}

/** 取消订阅 
 * 超过 7 天（鉴赏期）时，由于不需要退款，所以
 * 引导用户到 stripe 托管的页面去取消（管理）订阅
 * 在鉴赏期内，才引导用户在应用内点击 “取消订阅” 再向该接口发起请求
*/
async function handle_cancel_and_refund(
  body: Record<string, string>,
  user: Table_User, 
): Promise<LiuRqReturn> {

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
    const res2 = await toRefundAndCancel(body, user)
    return res2
  }

  return { code: "SP009" }
}

/** 退款再取消
 *  1. 查找订单
 *  2. 发起退款
 *  3. 发起立即取消订阅
 */
async function toRefundAndCancel(
  body: Record<string, string>,
  user: Table_User,
): Promise<LiuRqReturn> {
  // 1. get order
  const w: Partial<Table_Order> = {
    user_id: user._id,
    oState: "OK",
    orderType: "subscription",
  }
  const col_order = db.collection("Order")
  const q1 = col_order.where(w).orderBy("insertedStamp", "desc")
  const res1 = await q1.getOne<Table_Order>()
  const theOrder = res1.data

  // 2. return ok if no order
  if(!theOrder) {
    return { code: "0000" }
  }

  // 3. get arguments
  const sub_id = user.stripe_subscription_id
  const { payChannel } = theOrder

  // 4. decide which channel to refund and cancel
  let res4: LiuRqReturn = { 
    code: "E5001", errMsg: "no channel to refund and cancel"
  }
  if(payChannel === "stripe" && sub_id) {
    res4 = await toRefundAndCancelThroughStripe(user, theOrder)
  }
  else if(payChannel === "alipay") {
    res4 = await toRefundAndCancelThroughAlipay(user, theOrder)
  }
  else if(payChannel === "wxpay") {
    res4 = await toRefundAndCancelThroughWxpay(user, theOrder)
  }

  return res4
}

async function toRefundAndCancelThroughAlipay(
  user: Table_User,
  order: Table_Order,
): Promise<LiuRqReturn> {
  // 1. get arguments
  const stamp1 = getNowStamp()
  const alipayData = order.alipay_other_data ?? {}
  const trade_no = alipayData.trade_no
  if(!trade_no) {
    return { code: "E5001", errMsg: "no trade_no in alipay_other_data" }
  }
  if(alipayData.out_request_no) {
    return { code: "SP011", errMsg: "the order has been refunded" }
  }
  const refundStamp = alipayData.refund_created_stamp ?? 0
  const diff1 = stamp1 - refundStamp
  if(diff1 < SEC_5) {
    return { code: "E4003", errMsg: "request too frequently" }
  }

  // 2. get refund amount
  const out_request_no = createRefundNo()
  const refundAmount = order.paidAmount - order.refundedAmount
  if(refundAmount <= 0) {
    return { code: "SP010", errMsg: "the refund amount is not positive" } 
  }
  // turn refund_amount to yuan
  const refund_amount = (refundAmount / 100).toFixed(2)

  // 3. get refund reason
  const { t } = useI18n(subPlanLang, { user })
  const refund_reason = t("seven_days_refund")

  // 4. construct Alipay_Refund_Param
  const arg4: Alipay_Refund_Param = {
    refund_amount,
    trade_no,
    refund_reason,
    out_request_no,
  }

  // 5. to fetch
  const res5 = await AlipayHandler.refund(arg4)
  if(!res5.pass) return res5.err

  // 6. update order
  alipayData.out_request_no = out_request_no
  alipayData.refund_created_stamp = stamp1
  const u5: Partial<Table_Order> = {
    refundedAmount: order.refundedAmount + refundAmount,
    alipay_other_data: alipayData,
    updatedStamp: getNowStamp(),
  }
  const oCol = db.collection("Order")
  const res6 = await oCol.doc(order._id).update(u5)

  // 7. terminate user's subscription
  await terminateUserSubscription(user)

  const stamp2 = getNowStamp()
  const diffTime = stamp2 - stamp1
  console.log("diffTime of toRefundAndCancelThroughAlipay: ", diffTime)
  
  return { code: "0000" }
}

async function toRefundAndCancelThroughWxpay(
  user: Table_User,
  order: Table_Order,
): Promise<LiuRqReturn> {
  const time1 = getNowStamp()

  // 1. get arguments
  const wxpayData = order.wxpay_other_data ?? {}
  const transaction_id = wxpayData.transaction_id
  if(!transaction_id) {
    return { code: "E5001", errMsg: "no transaction_id in wxpay_other_data" }
  }
  if(wxpayData.refund_id) {
    return { code: "SP011", errMsg: "the order has been refunded" }
  }

  // 2. get refund amount
  const out_refund_no = createRefundNo()
  const refund_amount = order.paidAmount - order.refundedAmount
  if(refund_amount <= 0) {
    return { code: "SP010", errMsg: "the refund amount is not positive" } 
  }

  // 3. get refund reason
  const { t } = useI18n(subPlanLang, { user })
  const reason = t("seven_days_refund")

  // 4. construct arg and request refund
  const arg4: Wxpay_Refund_Custom_Param = {
    transaction_id,
    out_refund_no,
    refund_amount,
    total_amount: order.paidAmount,
    reason,
  }
  const refund_created_stamp = getNowStamp()
  const res4 = await WxpayHandler.refund(arg4)
  if(!res4.pass) return res4.err

  console.log("res of WxpayHandler.refund: ")
  console.log(res4)

  // 5. update order
  const d5 = res4.data
  wxpayData.refund_id = d5.refund_id
  wxpayData.refund_created_stamp = refund_created_stamp
  const u5: Partial<Table_Order> = {
    refundedAmount: d5.amount.refund,
    wxpay_other_data: wxpayData,
    updatedStamp: getNowStamp(),
  }
  const oCol = db.collection("Order")
  const res5 = await oCol.doc(order._id).update(u5)

  console.log("res of oCol.doc(order._id).update: ")
  console.log(res5)

  // 6. terminate user's subscription
  await terminateUserSubscription(user)

  const time2 = getNowStamp()
  const diffTime = time2 - time1
  console.log("diffTime of toRefundAndCancelThroughWxpay: ", diffTime)

  return { code: "0000" }
}

async function terminateUserSubscription(
  user: Table_User,
) {
  const sub = user.subscription
  if(!sub) {
    console.warn("no subscription in the user")
    return
  }
  const now = getNowStamp()
  sub.expireStamp = now
  const u1: Partial<Table_User> = {
    subscription: sub,
    updatedStamp: now,
  }
  const col_user = db.collection("User")
  const res1 = await col_user.doc(user._id).update(u1)
  console.log("terminateUserSubscription res: ")
  console.log(res1)
  const newUser: Table_User = { ...user, ...u1 }
  updateUserInCache(user._id, newUser)
}


async function toRefundAndCancelThroughStripe(
  user: Table_User,
  order: Table_Order,
): Promise<LiuRqReturn> {
  const stripe = LiuStripe.getStripeInstance()
  if(!stripe) {
    return { 
      code: "E5001", 
      errMsg: "no stripe instance during requestStripeToRefund",
    }
  }
  const sub_id = user.stripe_subscription_id as string
  const { paidAmount, refundedAmount, stripe_charge_id } = order

  // refund
  if(refundedAmount < paidAmount && stripe_charge_id) {
    const refundAmt = paidAmount - refundedAmount
    const res1 = await requestStripeToRefund(stripe, refundAmt, stripe_charge_id)
    if(!res1) return { code: "SP007", errMsg: "fail to refund" }
  }

  // cancel immediately
  let res2: Stripe.Subscription
  try {
    res2 = await stripe.subscriptions.cancel(sub_id)
    console.log("res of stripe.subscriptions.cancel: ")
    console.log(res2)
  }
  catch(err) {
    console.warn("err during stripe.subscriptions.cancel")
    console.log(err)
    return { code: "SP008" }
  }

  return { code: "0000" }
}

/** interact with Stripe */
async function requestStripeToRefund(
  stripe: Stripe,
  refundAmt: number,
  stripe_charge_id: string,
) {
  try {
    const res1 = await stripe.refunds.create({
      charge: stripe_charge_id,
      amount: refundAmt,
      reason: "requested_by_customer",
    })
    console.log("result of stripe.refunds.create: ")
    console.log(res1)
    return true
  }
  catch(err) {
    console.warn("err of stripe.refunds.create: ")
    console.log(err)
  }
  return false
}


/** 获取订阅方案的消息 */
async function handle_info(
  ctx: FunctionContext,
) {
  const _env = process.env
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

  // check out wxpay
  let wxpay = d.wxpay
  const wx_appid = _env.LIU_WX_GZ_APPID
  const wx_mchid = _env.LIU_WXPAY_MCH_ID
  const wxpay_notify_url = _env.LIU_WXPAY_NOTIFY_URL
  if(!wx_appid || !wx_mchid || !wxpay_notify_url) {
    wxpay = undefined
  }

  // check out alipay
  let alipay = d.alipay
  const alipay_appid = _env.LIU_ALIPAY_APP_ID
  const alipay_notify_url = _env.LIU_ALIPAY_NOTIFY_URL
  if(!alipay_appid || !alipay_notify_url) {
    alipay = undefined
  }

  const sym = getCurrencySymbol(currency)
  const r: Res_SubPlan_Info = {
    id: d._id,
    payment_circle: d.payment_circle,
    badge: d.badge,
    title: d.title,
    desc: d.desc,
    stripe: d.stripe,
    wxpay,
    alipay,
    price,
    currency,
    symbol: sym,
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
  const userTimezone = body.x_liu_timezone
  const subscription_id = body.subscription_id
  if(!subscription_id || typeof subscription_id !== "string") {
    return { code: "E4000", errMsg: "subscription_id is required" }
  }
  const _env = process.env
  const { LIU_DOMAIN } = _env
  if(!LIU_DOMAIN) {
    return { code: "E5001", errMsg: "there is no domain in env" }
  }
  const stripe = LiuStripe.getStripeInstance()
  if(!stripe) {
    return { code: "E5001", errMsg: "no stripe api key" }
  }

  // 2. 去查看 user 是否已经订阅，并且有效
  const canBind = checkIfUserCanBindStripe(user)
  if(!canBind) {
    return { code: "SP001", errMsg: "there is no need to bind stripe" }
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

  const param: Stripe.Checkout.SessionCreateParams = {
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      }
    ],
    mode: "subscription",
    success_url: `${LIU_DOMAIN}/payment-success`,
    cancel_url: `${LIU_DOMAIN}/subscription`,
    automatic_tax: { enabled: true },
    expires_at,
  }

  // set billing_cycle_anchor
  const billing_cycle_anchor = getBillingCycleAnchor(user)
  if(billing_cycle_anchor) {
    param.subscription_data = {
      billing_cycle_anchor,
      proration_behavior: "none"
    }
  }

  // set either customer or email
  if(user.stripe_customer_id) {
    param.customer = user.stripe_customer_id
  }
  else if(user.email) {
    param.customer_email = user.email
  }

  let session: Stripe.Response<Stripe.Checkout.Session>
  try {
    session = await stripe.checkout.sessions.create(param)
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
    userId: user._id,
    stripeCheckoutSession: session,
    meta_data: {
      payment_circle: data_2.payment_circle,
      payment_timezone: userTimezone,
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