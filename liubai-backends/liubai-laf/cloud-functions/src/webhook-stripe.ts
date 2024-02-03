import Stripe from "stripe"
import type { 
  LiuRqReturn,
  Table_Credential,
  MongoFilter,
  Table_User,
  SubscriptionPaymentCircle,
  UserSubscription,
  Table_Order,
} from "@/common-types"
import cloud from "@lafjs/cloud"
import { 
  getNowStamp, 
  getServerTimezone, 
  formatTimezone, 
  getBasicStampWhileAdding,
} from "@/common-time"
import { addHours, addMonths, addYears, set as date_fn_set } from "date-fns"
import { createOrderId } from "@/common-ids"
import { updateUserInCache, getIdFromStripeObj } from "@/common-util"

const db = cloud.database()

/*************** some types in webhook-stripe ****************/
interface CofiacParam {
  invoice: Stripe.Invoice
  charge?: Stripe.Charge
  plan: string
  user: Table_User
  stripe_subscription_id: string
}

/**************** some functions ******************/

export async function main(ctx: FunctionContext) {

  const res0 = preCheck(ctx)
  if(res0) {
    return res0
  }

  const res1 = await retrieveEvent(ctx)
  const event = res1.event
  if(!event || res1.rqReturn) {
    return res1.rqReturn
  }
  const res2 = await handleStripeEvent(event)
  return res2
}


/** 预检查参数 */
function preCheck(
  ctx: FunctionContext
): LiuRqReturn<undefined> | undefined {
  const _env = process.env
  const sk = _env.LIU_STRIPE_API_KEY
  if(!sk) {
    return { code: "E5001", errMsg: "stripe api key is not existed in process.env" }
  }

  const body = ctx.body ?? {}
  const sig = ctx.headers?.['stripe-signature']
  
  if(!sig) {
    return { code: "E4000", errMsg: "stripe-signature in headers is required" }
  }

  const {
    api_version,
    id,
    data,
    type,
  } = body

  if(!api_version || typeof api_version !== "string") {
    return { code: "E4000", errMsg: "api_version in body is required" }
  }

  if(!id || typeof id !== "string") {
    return { code: "E4000", errMsg: "id in body is required" }
  }

  if(!data?.object) {
    return { code: "E4000", errMsg: "data.object in body is required" }
  }

  if(!type || typeof type !== "string") {
    return { code: "E4000", errMsg: "type in body is required" }
  }
}


/** to get stripe's instance */
function getStripeInstance() {
  const _env = process.env
  const sk = _env.LIU_STRIPE_API_KEY as string
  const stripe = new Stripe(sk)
  return stripe
}


interface RetrieveEventRes {
  rqReturn?: LiuRqReturn<undefined>
  event?: Stripe.Event
}

/** 检索 stripe 事件 */
async function retrieveEvent(
  ctx: FunctionContext
): Promise<RetrieveEventRes> {
  const stripe = getStripeInstance()

  const id = ctx.body?.id as string
  try {
    const event = await stripe.events.retrieve(id)
    return { event }
  }
  catch(err) {
    console.warn("stripe.events.retrieve failed")
    console.log(err)
  }

  return { rqReturn: { code: "E4004", errMsg: "cannot retrieve the event by id" } }
}


/** 处理 stripe event */
async function handleStripeEvent(
  evt: Stripe.Event,
): Promise<LiuRqReturn> {
  const tp = evt.type
  console.log(`当前 event type: ${tp}`)

  let res: LiuRqReturn = { code: "E4000" }
  if(evt.type === "checkout.session.completed") {
    const obj = evt.data.object
    res = await handle_session_completed(obj)
  }
  else if(tp === "checkout.session.expired") {
    const obj = evt.data.object
    res = await handle_session_expired(obj)
  }
  else if(tp === "checkout.session.async_payment_succeeded") {
    const obj = evt.data.object
    handle_session_async_py_succeeded(obj)
  }
  else if(tp === "checkout.session.async_payment_failed") {
    const obj = evt.data.object
    handle_session_async_py_failed(obj)
  }
  else if(tp === "invoice.payment_succeeded") {
    const obj = evt.data.object
    handle_invoice_py_succeeded(obj)
  }
  else if(tp === "charge.refund.updated") {
    const obj = evt.data.object
    handle_charge_refund_updated(obj)
  }
  else if(tp === "charge.refunded") {
    const obj = evt.data.object
    handle_charge_refunded(obj)
  }
  else if(tp === "charge.succeeded") {
    const obj = evt.data.object
    handle_charge_succeeded(obj)
  }
  else if(tp === "customer.subscription.created") {
    const obj = evt.data.object
    handle_subscription_created(obj)
  }
  else if(tp === "customer.subscription.deleted") {
    const obj = evt.data.object
    handle_subscription_deleted(obj)
  }
  else if(tp === "customer.subscription.paused") {
    const obj = evt.data.object
    handle_subscription_paused(obj)
  }
  else if(tp === "customer.subscription.resumed") {
    const obj = evt.data.object
    handle_subscription_resumed(obj)
  }
  else if(tp === "customer.subscription.trial_will_end") {
    const obj = evt.data.object
    handle_subscription_twe(obj)
  }
  else if(tp === "customer.subscription.updated") {
    const obj = evt.data.object
    handle_subscription_updated(obj)
  }
  else if(tp === "payment_intent.amount_capturable_updated") {
    // PaymentIntent 可捕获的金额发生更新
    const obj = evt.data.object
    handle_pi_amount_capturable_updated(obj)
  }
  else if(tp === "payment_intent.canceled") {
    // PaymentIntent 已取消
    const obj = evt.data.object
    handle_pi_canceled(obj)
  }
  else if(tp === "payment_intent.processing") {
    // PaymentIntent 开始进行处理
    const obj = evt.data.object
    handle_pi_processing(obj)
  }
  else if(tp === "payment_intent.requires_action") {
    // PaymentIntent 过渡到 requires_action 状态时
    const obj = evt.data.object
    handle_pi_requires_action(obj)
  }
  else if(tp === "payment_intent.succeeded") {
    // PaymentIntent 已被完成支付
    const obj = evt.data.object
    handle_pi_succeeded(obj)
  }
  else if(tp === "payment_intent.payment_failed") {
    // PaymentIntent 尝试 "创建支付方法或支付" 失败时
    const obj = evt.data.object
    handle_pi_payment_failed(obj)
  }
  else {
    console.warn("出现未定义处理函数的事件")
    console.log(evt)
    console.log(evt.data.object)
    return { code: "0000" }
  }
  
  return res
}


async function handle_pi_amount_capturable_updated(
  obj: Stripe.PaymentIntent,
) {
  console.warn("PaymentIntent 可捕获的金额发生更新")
  console.log(obj)
}

async function handle_pi_canceled(
  obj: Stripe.PaymentIntent,
) {
  console.warn("PaymentIntent 已取消")
  console.log(obj)
}

async function handle_pi_processing(
  obj: Stripe.PaymentIntent,
) {
  console.warn("PaymentIntent 开始进行处理")
  console.log(obj)
}

async function handle_pi_requires_action(
  obj: Stripe.PaymentIntent,
) {
  console.warn("PaymentIntent 过渡到 requires_action 状态时")
  console.log(obj)
}

async function handle_pi_succeeded(
  obj: Stripe.PaymentIntent,
) {
  console.warn("PaymentIntent 已被完成支付")
  console.log(obj)
}


async function handle_pi_payment_failed(
  obj: Stripe.PaymentIntent,
) {
  console.warn("PaymentIntent 似乎创建失败或支付失败")
  console.log(obj)
}


async function handle_session_async_py_succeeded(
  obj: Stripe.Checkout.Session,
) {
  console.warn("似乎 session 异步支付成功了")
  console.log(obj)
}

async function handle_session_async_py_failed(
  obj: Stripe.Checkout.Session,
) {
  console.warn("似乎 session 异步支付失败了")
  console.log(obj)
}

async function handle_invoice_py_succeeded(
  obj: Stripe.Invoice
) {
  console.warn("似乎 发票 付款成功了")
  console.log(obj)
}


async function handle_charge_refund_updated(
  obj: Stripe.Refund,
) {
  console.warn("似乎 有退款信息 被更新......")
  console.log(obj)
  
}

async function handle_charge_refunded(
  obj: Stripe.Charge,
) {
  console.warn("似乎 有收款 被退款（即使是部分退款，也会触发）")
  console.log(obj)
}


async function handle_charge_succeeded(
  obj: Stripe.Charge,
) {
  console.warn("似乎 索取费用 成功了")
  console.log(obj)
}

async function handle_subscription_created(
  obj: Stripe.Subscription,
) {
  console.warn("似乎 订阅 被创建了")
  console.log(obj)
}

async function handle_subscription_paused(
  obj: Stripe.Subscription,
) {
  console.warn("似乎 订阅 被暂停了")
  console.log(obj)
}

async function handle_subscription_resumed(
  obj: Stripe.Subscription,
) {
  console.warn("似乎 订阅 被恢复了")
  console.log(obj)
  
}

async function handle_subscription_deleted(
  obj: Stripe.Subscription,
) {
  console.warn("似乎 订阅 被删除了")
  console.log(obj)
  
}

/** trial will end 
 * 在订阅试用期计划结束前三天发生，或者在试用立即结束时发生（使用 trial_end=now ）。
*/
async function handle_subscription_twe(
  obj: Stripe.Subscription,
) {
  console.warn("似乎 订阅 试用即将到期")
  console.log(obj)
}


/** trial will end 
 * 当订阅信息被更新时
*/
async function handle_subscription_updated(
  obj: Stripe.Subscription,
) {
  console.warn("似乎 订阅 发生更新")
  console.log(obj)
}


/** 处理 checkout.session.completed 结账会话已完成 
 * 创建订单可能不会在这个周期里，而是在 invoice.payment_succeeded 周期里
*/
async function handle_session_completed(
  obj: Stripe.Checkout.Session
) {
  console.warn("似乎 session 被完成了!")
  console.log(obj)
  const session_id = obj.id

  // 0. check the session
  const { 
    payment_status, 
    status, 
    subscription: stripe_sub,
  } = obj

  // payment_status 可能为 no_payment_required 表示未来才需要付款
  // 因为可能是用户当前就已经在订阅期内了（比如免费送会员等等）
  if(payment_status === "unpaid" || status !== "complete") {
    console.log("当前 payment_status 或 status 不符合预期.........")
    return { code: "0000" }
  }
  const stripe_subscription_id = getIdFromStripeObj(stripe_sub)
  if(!stripe_subscription_id) {
    console.log("Checkout.Session 中 subscription 不存在......")
    return { code: "E4000", errMsg: "there is no subscription in Checkout.Session" }
  }

  // 1. query Credential 
  const w: Partial<Table_Credential> = {
    infoType: "stripe-checkout-session",
    credential: session_id,
  }
  const col_cred = db.collection("Credential")
  const q = col_cred.where(w)
  const res = await q.getOne<Table_Credential>()
  const cred = res.data
  const cred_id = cred?._id
  const userId = cred?.userId
  const meta_data = cred?.meta_data
  const payment_circle = meta_data?.payment_circle
  const payment_timezone = meta_data?.payment_timezone
  const plan = meta_data?.plan
  if(!cred || !cred_id) {
    // 查无 credential
    return { code: "E4004", errMsg: "there is no credential" }
  }
  if(!userId) {
    console.warn("there is no userId in the credential")
    return { code: "E5001", errMsg: "there is no user_id in the credential" }
  }
  if(!payment_circle) {
    console.warn("there is no meta_data.payment_circle in the credential")
    return { code: "E5001", errMsg: "there is no meta_data.payment_circle in the credential" }
  }
  if(!plan) {
    console.warn("there is no meta_data.plan in the credential")
    return { code: "E5001", errMsg: "there is no meta_data.plan in the credential" }
  }
  

  // 2. to query the user to make sure that 
  // there is no double charged during a short term
  const col_user = db.collection("User")
  const res2 = await col_user.doc(userId).get<Table_User>()
  let user = res2.data
  if(!user) {
    console.warn("the user does not exist.......")
    return { code: "E5001" }
  }
  const oldUserSub = user.subscription
  const chargedStamp = oldUserSub?.chargedStamp ?? 1
  const now = getNowStamp()
  const diff_1 = now - chargedStamp
  if(diff_1 < 5000) {
    console.warn("5s 内被重复充值，拒绝继续执行........")
    return { code: "E4003", errMsg: "pay too much" }
  }

  // 3. to get Subscription from Stripe
  const stripe = getStripeInstance()
  let sub: Stripe.Subscription
  try {
    sub = await stripe.subscriptions.retrieve(stripe_subscription_id)
  }
  catch(err) {
    console.warn("stripe.subscriptions.retrieve: ")
    console.log(err)
    return { code: "E4004", errMsg: "we cannot retrieve subscription" }
  }

  // 4. get invoice or charge if allowed
  let invoice: Stripe.Invoice | undefined
  let charge: Stripe.Charge | undefined
  
  const invoice_id = sub.latest_invoice
  if(typeof invoice_id === "string") {
    const inv_cha = await getInvoiceAndCharge(invoice_id)
    invoice = inv_cha.invoice
    charge = inv_cha.charge
  }
  
  // 5. generate a new subscription in user
  const newUserSub: UserSubscription = {
    isOn: sub.status === "active" ? "Y" : "N",
    plan,
    isLifelong: false,
    createdStamp: sub.start_date * 1000,
    expireStamp: sub.current_period_end * 1000,
    chargedStamp: invoice ? invoice.created * 1000 : undefined,
  }
  if(oldUserSub?.isLifelong) {
    newUserSub.isLifelong = true
    delete newUserSub.expireStamp
  }
  if(!Boolean(sub.canceled_at) && sub.collection_method === "charge_automatically") {
    newUserSub.autoRecharge = true
  }
  else {
    newUserSub.autoRecharge = false
  }
  if(oldUserSub?.createdStamp) {
    if(oldUserSub.createdStamp < newUserSub.createdStamp) {
      newUserSub.createdStamp = oldUserSub.createdStamp
    }
  }
  if(oldUserSub?.expireStamp && newUserSub.expireStamp) {
    if(oldUserSub.expireStamp > newUserSub.expireStamp) {
      newUserSub.expireStamp = oldUserSub.expireStamp
    }
  }

  // 6. to update user
  const uUser: Partial<Table_User> = {
    stripe_subscription_id,
    subscription: newUserSub,
    updatedStamp: getNowStamp(),
  }
  const res6 = await col_user.where({ _id: user._id }).update(uUser)
  console.log("在 handle_session_completed 中看一下更新 user 的结果........")
  console.log(res6)

  user = { ...user, ...uUser }
  updateUserInCache(user._id, user)
  
  // 7. create an order
  if(invoice) {
    const cofiac: CofiacParam = { 
      invoice,
      charge,
      plan,
      user,
      stripe_subscription_id,
    }
    await createOrderFromInvoiceAndCharge(cofiac)
  }
  
  // 9. to delete the credential
  const res9 = await col_cred.where({ _id: cred_id }).remove()
  console.log("take a look of removing a credential")
  console.log(res9)

  return { code: "0000" }
}


/** to create order */
async function createOrderFromInvoiceAndCharge(
  param: CofiacParam,
) {
  const {
    invoice,
    charge,
    plan,
    user,
    stripe_subscription_id,
  } = param
  const orderId = await createAvailableOrderId()
  if(!orderId) {
    console.warn("fail to create an orderId")
    return
  }
  console.log("take a look of a new orderId: ")
  console.log(orderId)
  const basic1 = getBasicStampWhileAdding()
  const hosted_invoice_url = invoice.hosted_invoice_url ?? ""
  const receipt_url = charge?.receipt_url ?? ""
  const payment_intent = invoice.payment_intent
  const stripe_payment_intent_id = getIdFromStripeObj(payment_intent)

  const anOrder: Omit<Table_Order, "_id"> = {
    ...basic1,
    order_id: orderId,
    user_id: user._id,
    oState: "OK",
    orderStatus: "PAID",
    orderAmount: invoice.total,
    paidAmount: invoice.amount_paid,
    refundedAmount: 0,
    currency: invoice.currency,
    payChannel: "stripe",
    orderType: "subscription",
    plan_id: plan,
    tradedStamp: invoice.created * 1000,
    stripe_subscription_id,
    stripe_invoice_id: invoice.id,
    stripe_charge_id: charge?.id,
    stripe_payment_intent_id,
    stripe_other_data: {
      hosted_invoice_url,
      receipt_url,
    },
  }
  const col_order = db.collection("Order")
  const res7 = await col_order.add(anOrder)
  console.log("看一下订单被创建的结果.......")
  console.log(res7)
  return orderId
}


interface GetInvoiceAndChargeRes {
  invoice?: Stripe.Invoice
  charge?: Stripe.Charge
}

/** to get invoice and charge */
async function getInvoiceAndCharge(
  invoice_id: string
): Promise<GetInvoiceAndChargeRes> {
  if(!invoice_id) return {}
  const stripe = getStripeInstance()
  let invoice: Stripe.Invoice | undefined
  try {
    invoice = await stripe.invoices.retrieve(invoice_id, { expand: ["charge"] })
  }
  catch(err) {
    console.warn("stripe.invoices.retrieve: ")
    console.log(err)
    return {}
  }
  const charge = invoice.charge as Stripe.Charge
  return { invoice, charge }
}



/** the func is for one-off trade, which is not developed */
function getNewExpireStamp(
  payment_circle: SubscriptionPaymentCircle,
  payment_timezone?: string,
  oldExpireStamp?: number,
) {
  const now = getNowStamp()
  let startStamp = oldExpireStamp ? oldExpireStamp : now
  if(startStamp < now) {
    startStamp = now
  }

  const startDate = new Date(startStamp)
  let endDate = new Date(startStamp)
  if(payment_circle === "monthly") {
    endDate = addMonths(startDate, 1)
  }
  else if(payment_circle === "yearly") {
    endDate = addYears(startDate, 1)
  }

  // set endDate to 23:59:59 for user's timezone
  const userTimezone = formatTimezone(payment_timezone)
  // get what o'clock for user's timezone
  const userHrs = getHoursOfSpecificTimezone(userTimezone)
  const diffHrs = 23 - userHrs
  if(diffHrs !== 0) {
    endDate = addHours(endDate, diffHrs)
  }
  // turn the minutes & seconds into 59 and 59
  endDate = date_fn_set(endDate, { minutes: 59, seconds: 59, milliseconds: 0 })
  
  const endStamp = endDate.getTime()
  return endStamp
}

/** to get the current hours of a specific timezone */
function getHoursOfSpecificTimezone(timezone: number) {
  const serverTimezone = getServerTimezone() 
  const serverHrs = (new Date()).getHours()
  const diffTimezone = timezone - serverTimezone
  const hrs = (serverHrs + diffTimezone) % 24 
  return hrs
}


/** 处理 checkout.session.expired 结账会话已过期 */
async function handle_session_expired(
  obj: Stripe.Checkout.Session
) {
  console.warn("似乎 session 被过期了!")
  console.log(obj)

  // 1. 去把 Credential 里寻找该行数据
  const w: MongoFilter<Table_Credential> = {
    infoType: "stripe-checkout-session",
    credential: obj.id,
  }

  const col = db.collection("Credential")
  const q = col.where(w)
  const res = await q.getOne<Table_Credential>()
  console.log("handle_session_expired q.getOne 查询结果.........")
  console.log(res)
  const _id = res.data?._id
  if(!_id) {
    return { code: "0000" }
  }

  const q2 = col.where({ _id })
  const res2 = await q2.remove()
  console.log("查看 Credential 被删除的结果 用旧版写法.....")
  console.log(res2)

  return { code: "0000" }
}

/** create an available orderId */
async function createAvailableOrderId() {
  let num = 0
  let orderId = ""
  const col_order = db.collection("Order")
  while(true) {
    if(num > 3) break

    let tmpId = createOrderId()
    const res = await col_order.where({ order_id: tmpId }).getOne<Table_Order>()
    const rData = res.data
    
    if(!rData) {
      orderId = tmpId
      break
    }

    num++
  }

  return orderId
}

