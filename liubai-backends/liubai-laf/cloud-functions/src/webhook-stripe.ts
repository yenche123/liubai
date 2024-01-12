import Stripe from "stripe"
import type { 
  LiuRqReturn,
} from "@/common-types"
import { getNowStamp } from "@/common-time"

export async function main(ctx: FunctionContext) {

  const body = ctx.body
  const sig = ctx.headers?.['stripe-signature']

  //@ts-expect-error: rawBody
  const rawBody = ctx.request.rawBody

  console.log("看一下 body:")
  console.log(body)
  console.log("看一下 rawBody: ")
  console.log(rawBody)
  console.log("看一下 sig:")
  console.log(sig)

  let res: LiuRqReturn = { code: "E4000" }
  if(sig && typeof sig === "string") {
    handle_stripe(ctx, body, sig)
  }

  return res
}


async function handle_stripe(
  ctx: FunctionContext,
  body: Record<string, any>,
  sig: string,
) {
  const _env = process.env
  const sk = _env.LIU_STRIPE_API_KEY
  const endpointSecret = _env.LIU_STRIPE_ENDPOINT_SECRET
  if(!sk || !endpointSecret) {
    return { code: "E5001", errMsg: "stripe api key & endpoint secret are required" }
  }

  const obj0 = body?.data?.object

  const stripe = new Stripe(sk)
  const payload = JSON.stringify(body, null, 2)

  let event: Stripe.Event | undefined;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
  }
  catch(err) {
    console.warn("使用 constructEvent 失败........")
    console.log(err)
    console.log(" ")
  }

  console.log("看一下 event")
  console.log(event)

  const id = body.id as string
  if(!id) {
    return { code: "E5001", errMsg: "body.id is supposed to exist" }
  }

  let event2: Stripe.Event | undefined
  try {
    let d1 = getNowStamp()
    event2 = await stripe.events.retrieve(id)
    let d2 = getNowStamp()
    const s1 = d2 - d1
    console.log(`stripe.events.retrieve 耗时: ${s1}ms`)
  }
  catch(err) {
    console.warn("使用 stripe.events.retrieve 失败........")
    console.log(err)
    console.log(" ")
  }


  console.log("看一下 event2")
  console.log(event2)

  const type2 = event2?.type
  if(type2 === "checkout.session.completed") {
    const obj2 = event2.data.object
    console.log("obj2: ")
    console.log(obj2)

    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
      obj2.id,
      {
        expand: ['line_items'],
      }
    )
    console.log("看一下 sessionWithLineItems")
    console.log(sessionWithLineItems)

  }


  return true
}
