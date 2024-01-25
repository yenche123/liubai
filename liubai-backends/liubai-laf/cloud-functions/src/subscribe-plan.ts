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
} from "@/common-types";
import { getBasicStampWhileAdding, getNowStamp, MINUTE } from "@/common-time";


const db = cloud.database()

/** some constants */
const MIN_30 = MINUTE * 30

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

  return res
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

  // 2. 去查看 user 是否已经订阅
  const s1 = user.subscription
  const isOn = s1?.isOn
  const autoRecharge = s1?.autoRecharge
  const isLifelong = s1?.isLifelong
  if(isOn) {
    if(autoRecharge || isLifelong) {
      return { code: "SP001", errMsg: "the user has subscribed" }
    }
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

