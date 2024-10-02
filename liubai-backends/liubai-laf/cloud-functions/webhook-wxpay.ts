// Function Name: webhook-wxpay
// Receive messages and events from Weixin Pay
import cloud from '@lafjs/cloud'
import { 
  LiuDateUtil, 
  valTool, 
  WxpayHandler,
  extractOrderId,
  upgrade_user_subscription,
} from '@/common-util'
import { 
  wxpay_apiclient_key, 
  wxpay_apiclient_serial_no,
} from "@/secret-config"
import type {
  DataPass, 
  LiuErrReturn, 
  Table_Order,
  Wxpay_Notice_Base, 
  Wxpay_Notice_PaymentResource, 
  Wxpay_Notice_RefundResource, 
  Wxpay_Notice_Result, 
  WxpayVerifySignOpt,
} from "@/common-types"
import { getNowStamp } from './common-time'

/*************** some constants **********************/
const db = cloud.database()

export async function main(ctx: FunctionContext) {
  // 1. check out the signature
  const err1 = await checkFromWxpay(ctx)
  if(err1) {
    return err1
  }

  // 2. decrypt
  const res2 = await decryptData(ctx)
  if(res2.pass) {
    console.warn("解密成功......")
    console.log(res2.data)
  }
  else {
    console.warn("解密失败......")
    console.log(res2.err)
    ctx.response?.status(403)
    return res2.err
  }

  // 3. decide what to do next
  const d3 = res2.data
  const b3 = ctx.body as Wxpay_Notice_Base
  const event_type = b3.event_type
  if(event_type === "TRANSACTION.SUCCESS") {
    // when transaction success
    await handle_transaction_success(d3 as Wxpay_Notice_PaymentResource)
  }
  else if(event_type === "REFUND.SUCCESS") {
    // when refund success
    handle_refund_success(d3 as Wxpay_Notice_RefundResource)
  }
  else if(event_type === "REFUND.ABNORMAL") {
    // when refund abnormal
    handle_refund_abnormal(d3 as Wxpay_Notice_RefundResource)
  }
  else if(event_type === "REFUND.CLOSED") {
    // when refund closed
    handle_refund_closed(d3 as Wxpay_Notice_RefundResource)
  }

  return { code: "0000" }
}


async function handle_transaction_success(
  data: Wxpay_Notice_PaymentResource,
) {

  // 1. extract order_id from out_trade_no
  const { out_trade_no } = data
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
  const wxpayData = theOrder.wxpay_other_data ?? {}
  wxpayData.transaction_id = data.transaction_id
  wxpayData.trade_type = data.trade_type
  const u3: Partial<Table_Order> = {}
  u3.wxpay_other_data = wxpayData
  u3.orderAmount = data.amount.total
  u3.paidAmount = data.amount.payer_total
  u3.payChannel = "wxpay"
  u3.orderStatus = "PAID"
  u3.tradedStamp = LiuDateUtil.transformRFC3339ToStamp(data.success_time)
  try {
    u3.currency = data.amount.currency.toLowerCase()
  }
  catch(err) {
    console.warn("fail to update currency")
    console.log(err)
  }
  u3.updatedStamp = getNowStamp()
  oCol.doc(theOrder._id).update(u3)
  
  // 4. upgrade user's plan if he or she bought a subscription
  const oT = theOrder.orderType
  if(oT === "subscription" && theOrder.plan_id) {
    await upgrade_user_subscription(theOrder)
  }

  
}


function transaction_success_for_product(
  data: Wxpay_Notice_PaymentResource,
  theOrder: Table_Order,
) {
  // TODO

}


async function handle_refund_success(
  data: Wxpay_Notice_RefundResource,
) {
  console.warn("TODO: handle_refund_success")

}

async function handle_refund_abnormal(
  data: Wxpay_Notice_RefundResource,
) {
  console.warn("TODO: handle_refund_abnormal")
}

async function handle_refund_closed(
  data: Wxpay_Notice_RefundResource,
) {
  console.warn("TODO: handle_refund_closed")
}

async function decryptData(
  ctx: FunctionContext,
): Promise<DataPass<Wxpay_Notice_Result>> {
  const body = ctx.body as Wxpay_Notice_Base
  const resource = body.resource
  if(!resource) {
    return { 
      pass: false, 
      err: {
        code: "E4000",
        errMsg: "resource is empty",
      }
    }
  }

  const plaintext = WxpayHandler.decryptResource(resource)
  if(!plaintext) {
    return { 
      pass: false, 
      err: {
        code: "E4003",
        errMsg: "decrypt resource failed",
      }
    }
  }
  
  const obj = valTool.strToObj(plaintext) as Wxpay_Notice_Result
  return { pass: true, data: obj } 
}


async function checkFromWxpay(
  ctx: FunctionContext
): Promise<LiuErrReturn | undefined> {
  // 1. get params from headers
  const headers = ctx.headers ?? {}
  const signature = headers["wechatpay-signature"]
  const timestamp = headers["wechatpay-timestamp"]    // seconds
  const nonce = headers["wechatpay-nonce"]
  const serial = headers["wechatpay-serial"]

  // 2. check params
  if(!valTool.isStringWithVal(signature)) {
    return { code: "E4001", errMsg: "signature is empty" }
  }
  if(!valTool.isStringWithVal(timestamp)) {
    return { code: "E4002", errMsg: "timestamp is empty" }
  }
  if(!valTool.isStringWithVal(nonce)) {
    return { code: "E4003", errMsg: "nonce is empty" }
  }
  if(!valTool.isStringWithVal(serial)) {
    return { code: "E4003", errMsg: "serial is empty" }
  }

  // 3. check out our wxpay_apiclient_key and wxpay_apiclient_serial_no
  if(!wxpay_apiclient_key) {
    console.warn("wxpay_apiclient_key is not set")
    return { code: "E5001", errMsg: "wxpay_apiclient_key is not set" }
  }
  if(!wxpay_apiclient_serial_no) {
    console.warn("wxpay_apiclient_serial_no is not set")
    return { code: "E5002", errMsg: "wxpay_apiclient_serial_no is not set" }
  }

  // 4. handle body
  const b4_1 = ctx.request?.body
  const b4_2 = valTool.objToStr(b4_1)

  // 5. check out the signature
  const opt5: WxpayVerifySignOpt = {
    timestamp,
    nonce,
    signature,
    serial,
    body: b4_2,
  }
  const res5 = await WxpayHandler.verifySign(opt5)
  if(!res5) {
    if(!signature.startsWith("WECHATPAY/SIGNTEST/")) {
      console.warn("[webhook-wxpay] E4003 verify sign failed")
      console.log("ctx.headers: ")
      console.log(ctx.headers)
      console.log("ctx.request?.body: ")
      console.log(ctx.request?.body)
    }
    else {
      console.log("we get a test message from wxpay")
    }
    return { code: "E4003", errMsg: "verify sign failed" }
  }
  
}