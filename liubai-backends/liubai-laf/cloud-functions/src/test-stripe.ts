import Stripe from "stripe";

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
    })
  }
  catch(err) {
    console.warn("checkout.sessions.create error")
    console.log(err)
    console.log(" ")
    return { code: "E5001", errMsg: "create session err", err }
  }


  return { code: "0000", data: { session } }
}
