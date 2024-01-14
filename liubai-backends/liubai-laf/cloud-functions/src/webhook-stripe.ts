import Stripe from "stripe"
import type { 
  LiuRqReturn,
  Table_Credential,
  MongoFilter,
} from "@/common-types"
import cloud from "@lafjs/cloud"

const db = cloud.mongo.db

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
    console.log("看一下 retrieveEvent 的查询结果......")
    console.log(event)
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
    await handleCheckoutSessionCompleted(obj)
  }
  else if(tp === "checkout.session.expired") {
    const obj = evt.data.object
    res = await handleCheckoutSessionExpired(obj)
  }
  else if(tp === "checkout.session.async_payment_succeeded") {

  }
  else if(tp === "checkout.session.async_payment_failed") {
    
  }
  else {
    console.warn("出现未定义处理函数的事件")
    console.log(evt)
    console.log(evt.data.object)
    return { code: "0000" }
  }
  
  return res
}


/** 处理 checkout.session.completed 结账会话已完成 */
async function handleCheckoutSessionCompleted(
  obj: Stripe.Checkout.Session
) {

  console.log("查看当前 obj: ")
  console.log(obj)

  
}

/** 处理 checkout.session.expired 结账会话已完成 */
async function handleCheckoutSessionExpired(
  obj: Stripe.Checkout.Session
) {

  // 1. 去把 Credential 里寻找该行数据
  const w: MongoFilter<Table_Credential> = {
    infoType: "stripe-checkout-session",
    credential: obj.id,
  }

  const col = db.collection<Table_Credential>("Credential")
  const res = await col.findOne(w)
  console.log("handleCheckoutSessionExpired findOne 查询结果.........")
  console.log(res)

  const _id = res?._id
  if(!_id) {
    return { code: "0000" }
  }

  const res2 = await col.deleteOne({ _id })
  console.log("查看 Credential 被删除的结果.....")
  console.log(res2)

  return { code: "0000" }
}
