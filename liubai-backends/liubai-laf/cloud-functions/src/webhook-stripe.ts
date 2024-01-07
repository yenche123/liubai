import Stripe from "stripe"
import type { 
  LiuRqReturn,
} from "@/common-types"

export async function main(ctx: FunctionContext) {

  const body = ctx.body
  const sig = ctx.headers?.['stripe-signature']

  console.log("看一下 body:")
  console.log(body)
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
  body: Record<string, string>,
  sig: string,
) {
  const _env = process.env
  const sk = _env.LIU_STRIPE_API_KEY
  const endpointSecret = _env.LIU_STRIPE_ENDPOINT_SECRET
  if(!sk || !endpointSecret) {
    return { code: "E5001", errMsg: "stripe api key & endpoint secret are required" }
  }

  const stripe = new Stripe(sk)
  


  



}