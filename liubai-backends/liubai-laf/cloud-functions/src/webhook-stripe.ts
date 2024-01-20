import Stripe from "stripe"
import type { 
  LiuRqReturn,
  Table_Credential,
  MongoFilter,
  Table_User,
  SubscriptionPaymentCircle,
} from "@/common-types"
import cloud from "@lafjs/cloud"
import { getNowStamp, getServerTimezone, formatTimezone } from "@/common-time"
import { addHours, addMonths, addYears, set as date_fn_set } from "date-fns"

const db = cloud.database()

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

interface RetrieveEventRes {
  rqReturn?: LiuRqReturn<undefined>
  event?: Stripe.Event
}

/** 检索 stripe 事件 */
async function retrieveEvent(
  ctx: FunctionContext
): Promise<RetrieveEventRes> {
  const _env = process.env
  const sk = _env.LIU_STRIPE_API_KEY as string
  const stripe = new Stripe(sk)

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
    await handle_session_completed(obj)
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

  // 0. 查看 session 是否已支付
  const { payment_status, status, subscription } = obj
  if(payment_status === "unpaid" || status !== "complete") {
    console.log("当前 payment_status 或 status 不符合预期.........")
    return { code: "0000" }
  }

  // 1. 去查询 Credential 
  const w: Partial<Table_Credential> = {
    infoType: "stripe-checkout-session",
    credential: session_id,
  }
  const col = db.collection("Credential")
  const q = col.where(w)
  const res = await q.getOne<Table_Credential>()
  console.log("handle_session_completed q.getOne 查询结果.........")
  console.log(res)
  const cred = res.data
  const c_id = cred?._id
  const userId = cred?.userId
  const meta_data = cred?.meta_data
  const payment_circle = meta_data?.payment_circle
  const payment_timezone = meta_data?.payment_timezone
  if(!cred || !c_id) {
    // 订单已被创建，无需再执行其他操作
    return { code: "0000" }
  }
  if(!userId) {
    console.warn("there is no userId in the credential")
    return { code: "E5001" }
  }
  if(!payment_circle) {
    console.warn("there is no meta_data.payment_circle in the credential")
    return { code: "E5001" }
  }
  

  // 2. to query the user to make sure that 
  // there is no doubule charged during short term
  const col_2 = db.collection("User")
  const res2 = await col_2.doc(userId).get<Table_User>()
  const user = res2.data
  if(!user) {
    console.warn("the user does not exist.......")
    return { code: "E5001" }
  }
  const oldSubscription = user.subscription
  const chargedStamp = oldSubscription?.chargedStamp ?? 1
  const now = getNowStamp()
  const diff_1 = now - chargedStamp
  if(diff_1 < 5000) {
    console.warn("5s 内被重复充值，拒绝继续执行........")
    return { code: "E4003", errMsg: "pay too much" }
  }

  // 3. to update user

  // 4. to create a order

  // 5. to delete the credential

  
}


/** to calculate a new expireStamp */
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
