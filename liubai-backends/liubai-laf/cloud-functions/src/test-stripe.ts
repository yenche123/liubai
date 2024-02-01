import Stripe from "stripe";
import { getNowStamp, DAY } from "@/common-time";

const DAY_10 = DAY * 10

export async function main(ctx: FunctionContext) {
  const _env = process.env
  const { 
    LIU_STRIPE_API_KEY, 
    LIU_STRIPE_ENDPOINT_SECRET,
    LIU_STRIPE_TEST_PRICE_ID,
  } = _env
  if(!LIU_STRIPE_API_KEY || !LIU_STRIPE_ENDPOINT_SECRET) {
    return { code: "E5001", errMsg: "no stripe key & endpoint sercet" }
  }
  if(!LIU_STRIPE_TEST_PRICE_ID) {
    return { code: "E5001", errMsg: "no stripe test price id" }
  }

  const stripe = new Stripe(LIU_STRIPE_API_KEY)
  const YOUR_DOMAIN = `https://localhost:5175`
  const billing_cycle_anchor = Math.round((getNowStamp() + DAY_10) / 1000)
  let session: any
  try {
    session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: LIU_STRIPE_TEST_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${YOUR_DOMAIN}/payment-success`,
      cancel_url: `${YOUR_DOMAIN}/payment-cancel`,
      automatic_tax: {enabled: true},
      subscription_data: {
        billing_cycle_anchor,
        proration_behavior: "none",
      },
    })
  }
  catch(err) {
    console.warn("checkout.sessions.create error")
    console.log(err)
    console.log(" ")
    return { code: "E5001", errMsg: "create session err", err }
  }

  console.log("看一下 session: ")
  console.log(session)
  console.log(" ")

  return { code: "0000", data: { session } }
}
