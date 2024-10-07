// Function Name: webhook-alipay

import cloud from "@lafjs/cloud"
import { alipay_cfg } from "@/secret-config"
import { 
  AlipayHandler, 
  extractOrderId,
  LiuDateUtil,
  upgrade_user_subscription,
} from "@/common-util"
import { 
  type Table_Order, 
  type Alipay_Notice,
} from "@/common-types"
import { getNowStamp } from "@/common-time"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("webhook-alipay triggered")

  // 1. check sign
  const res1 = checkSign(ctx)
  if(!res1) {
    ctx.response?.status(403)
    return { code: "E4003", errMsg: "fail to check sign" }
  }

  // 2. choose what to do next
  const b2 = ctx.body as Alipay_Notice
  const trade_status = b2.trade_status
  if(trade_status === "TRADE_SUCCESS") {
    await handle_trade_success(b2)
  }


  return "success"
}

async function handle_trade_success(
  body: Alipay_Notice,
) {
  // 1. extract order_id from out_trade_no
  const { out_trade_no } = body
  console.log("out_trade_no: ", out_trade_no)
  const order_id = extractOrderId(out_trade_no)
  console.log("order_id: ", order_id)
  if(!order_id) {
    console.warn("fail to extract order_id from out_trade_no")
    return
  }

  // 2. get order from db
  const oCol = db.collection("Order")
  const res = await oCol.where({ order_id }).getOne<Table_Order>()
  const theOrder = res.data
  if(!theOrder) {
    console.warn("fail to get order from db")
    return
  }

  // 3. update the order
  const alipayData = theOrder.alipay_other_data ?? {}
  alipayData.trade_no = body.trade_no
  alipayData.buyer_open_id = body.buyer_open_id
  alipayData.buyer_logon_id = body.buyer_logon_id
  const {
    total_amount = "0",
    receipt_amount = "0",
    invoice_amount = "0",
    buyer_pay_amount = "0",
    gmt_payment,
  } = body
  if(!gmt_payment) {
    console.warn("gmt_payment is not set")
    return
  }
  let gmt_payment_2 = gmt_payment.replace(" ", "T") + "+08:00"
  const tradedStamp = LiuDateUtil.transformRFC3339ToStamp(gmt_payment_2)
  const orderAmount = turnYuanIntoCents(total_amount)
  const paidAmount = turnYuanIntoCents(invoice_amount)
  const u3: Partial<Table_Order> = {
    orderStatus: "PAID",
    orderAmount,
    paidAmount,
    payChannel: "alipay",
    alipay_other_data: alipayData,
    currency: "cny",
    tradedStamp,
    updatedStamp: getNowStamp(),
  }
  const res3 = await oCol.doc(theOrder._id).update(u3)
  console.log("res3..........")
  console.log(res3)

  // 4. upgrade user's plan if he or she bought a subscription
  const oT = theOrder.orderType
  if(oT === "subscription" && theOrder.plan_id) {
    await upgrade_user_subscription(theOrder)
  }

}


function turnYuanIntoCents(yuan: string) {
  const tmp = Number(yuan)
  if(isNaN(tmp)) {
    console.warn("fail to turn yuan into cents")
    console.log("yuan: ", yuan)
    return 0
  }
  const res = Math.round(tmp * 100)
  return res
}




function checkSign(ctx: FunctionContext) {
  const key1 = alipay_cfg.alipayPublicKey
  const key2 = alipay_cfg.privateKey
  if(!key1) {
    console.warn("alipay_cfg.alipayPublicKey is not set")
    return false
  }
  if(!key2) {
    console.warn("alipay_cfg.privateKey is not set")
    return false
  }

  const alipaySdk = AlipayHandler.getAlipaySdk()
  const body = ctx.body
  
  try {
    const res1 = alipaySdk.checkNotifySign(body)
    console.log("res1..........")
    console.log(res1)
    if(res1) return true
  }
  catch(err) {
    console.warn("fail to checkNotifySign")
    console.log(err)
    return false
  }

  try {
    const res2 = alipaySdk.checkNotifySignV2(body)
    console.log("res2..........")
    console.log(res2)
    if(res2) return true
  }
  catch(err) {
    console.warn("fail to checkNotifySignV2")
    console.log(err)
    return false
  }

  console.warn("fail to checkNotifySign or checkNotifySignV2")
  console.log(body)

  return false
}