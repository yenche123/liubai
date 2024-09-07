import cloud from "@lafjs/cloud"
import { 
  verifyToken,
  checker,
  createAvailableOrderId,
  getDocAddId,
} from "@/common-util"
import {
  type LiuErrReturn,
  type Res_OrderData,
  type Table_Order,
  type Table_User,
  type LiuRqReturn,
  Partial_Id,
  Sch_Param_PaymentOrder,
  Table_Subscription,
  Wxpay_Jsapi_Params,
} from "@/common-types"
import * as vbot from "valibot"
import * as crypto from "crypto"
import { getBasicStampWhileAdding, getNowStamp, MINUTE } from "@/common-time"
import { wxpay_apiclient_cert, wxpay_apiclient_key } from "@/secret-config"
import { createEncNonce } from "@/common-ids"

const db = cloud.database()
const _ = db.command

const MIN_3 = MINUTE * 3
const MIN_15 = MINUTE * 15
const MIN_30 = MINUTE * 30

export async function main(ctx: FunctionContext) {

  // 1. check out body
  const body = ctx.request?.body ?? {}
  const err1 = checkBody(ctx, body)
  if(err1) return err1

  // 2. go to specific operation
  const oT = body.operateType as string
  let res2: LiuRqReturn = { code: "E4000", errMsg: "operateType not found" }
  if(oT === "create_order") {
    // check out token
    const vRes = await verifyToken(ctx, body)
    if(!vRes.pass) return vRes.rqReturn
    const user = vRes.userData
    res2 = await create_sp_order(body, user)
  }
  else if(oT === "get_order") {

  }
  else if(oT === "wxpay_jsapi") {

  }

  return res2
}


async function wxpay_jsapi(
  body: Record<string, any>,
) {
  const order_id = body.order_id as string
  const wx_gzh_openid = body.wx_gzh_openid as string

  // 1. get order
  const oCol = db.collection("Order")
  const res1 = await oCol.where({ order_id }).getOne<Table_Order>()
  const d1 = res1.data
  if(!d1) {
    return { code: "E4004", errMsg: "order not found" }
  }

  // 2. check out order
  const now2 = getNowStamp()
  const stamp2 = d1.expireStamp ?? 1
  if(stamp2 < now2) {
    return { code: "E4006", errMsg: "the order is expired" }
  }
  if(d1.oState !== "OK") {
    return { code: "E4004", errMsg: "the order is not OK" }
  }
  if(d1.orderStatus === "PAYING") {
    return { code: "P0003", errMsg: "the order is being paid" }
  }
  if(d1.orderStatus === "PAID") {
    return { code: "P0004", errMsg: "the order is already paid" }
  }
  if(!d1.orderAmount) {
    return { code: "P0005", errMsg: "the order amount is zero" }
  }
  
  // 3. check out if we need to invoke JSAPI
  const wxData = d1.wxpay_other_data ?? {}
  let out_trade_no = wxData.jsapi_out_trade_no ?? ""
  let openid = wxData.jsapi_openid ?? ""
  let prepay_id = wxData.jsapi_prepay_id ?? ""
  let created_stamp = wxData.jsapi_created_stamp ?? 1
  const diff3 = now2 - created_stamp
  if(!out_trade_no) prepay_id = ""
  if(wx_gzh_openid !== openid) prepay_id = ""
  if(diff3 > MIN_15) prepay_id = ""

  // 4. to get prepay_id
  if(!prepay_id) {

    // 4.1 get subscription

    // 4.2 get prepay_id

    // 4.3 storage prepay_id

  }





  


  
  
}


// create subscription order
async function create_sp_order(
  body: Record<string, any>,
  user: Table_User,
) {
  // 1. get param
  const user_id = user._id
  const subscription_id = body.subscription_id as string
  const stamp1 = getNowStamp() + MIN_3

  // 2. construct query
  const w2 = {
    user_id,
    oState: "OK",
    orderStatus: "INIT",
    orderType: "subscription",
    plan_id: subscription_id,
    expireStamp: _.gte(stamp1),
  }
  const oCol = db.collection("Order")
  const res2 = await oCol.where(w2).getOne<Table_Order>()

  // 3. check out order and its expire time
  const d3 = res2.data
  if(d3) {
    const stamp3 = d3.expireStamp ?? 1
    const now2 = getNowStamp()
    if(stamp3 > now2) {
      const obj3 = packageOrderData(d3)
      return { code: "0000", data: { operateType: "create_order", orderData: obj3 } }
    }
  }

  // 4. get subscription
  const sCol = db.collection("Subscription")
  const res4 = await sCol.doc(subscription_id).get<Table_Subscription>()
  const d4 = res4.data
  if(!d4 || d4.isOn !== "N") {
    return { code: "E4004", errMsg: "subscription plan not found" }
  }

  // 5. check out amount_CNY
  if(typeof d4.amount_CNY !== "number") {
    return { code: "P0002", errMsg: "no amount_CNY in database" }
  }
  

  // 6. create new order
  const b6 = getBasicStampWhileAdding()
  const order_id = await createAvailableOrderId()
  if(!order_id) {
    return { code: "E5001", errMsg: "creating order_id ran into an error" }
  }
  const obj6: Partial_Id<Table_Order> = {
    ...b6,
    order_id,
    user_id,
    oState: "OK",
    orderStatus: "INIT",
    orderAmount: d4.amount_CNY,
    paidAmount: 0,
    refundedAmount: 0,
    currency: "cny",
    orderType: "subscription",
    plan_id: subscription_id,
  }
  const res6 = await oCol.add(obj6)

  // 7. get Table_Order._id
  const id7 =  getDocAddId(res6)
  if(!id7) {
    return { code: "E5001", errMsg: "creating an order failed" }
  }
  const newOrder: Table_Order = {
    _id: id7,
    ...obj6,
  }

  // 8. package
  const res8 = packageOrderData(newOrder)
  return { code: "0000", data: { operateType: "create_order", orderData: res8 } }
}


function packageOrderData(
  d: Table_Order,
) {
  const obj: Res_OrderData = {
    order_id: d.order_id,
    oState: d.oState,
    orderStatus: d.orderStatus,
    orderAmount: d.orderAmount,
    paidAmount: d.paidAmount,
    currency: d.currency,
    refundedAmount: d.refundedAmount,
    payChannel: d.payChannel,
    orderType: d.orderType,
    plan_id: d.plan_id,
    product_id: d.product_id,
    expireStamp: d.expireStamp,
    tradedStamp: d.tradedStamp,
    insertedStamp: d.insertedStamp,
  }
  return obj
}


async function getSubscriptionPlan(
  id: string,
) {
  const sCol = db.collection("Subscription")
  const res = await sCol.doc(id).get<Table_Subscription>()
  res.data
}


function getPrepayIdFromWxpay() {

}


function checkBody(
  ctx: FunctionContext,
  body: Record<string, any>,
): LiuErrReturn | undefined {
  // 1. check by valibot
  const res1 = vbot.safeParse(Sch_Param_PaymentOrder, body)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg }
  }

  // 2. check out wxpay_apiclient_cert
  const _env = process.env
  const oT = body.operateType as string
  if(oT === "wxpay_jsapi") {
    if(!wxpay_apiclient_cert) {
      return { code: "E4001", errMsg: "wxpay_apiclient_cert is not set" }
    }
    if(!wxpay_apiclient_key) {
      return { code: "E4001", errMsg: "wxpay_apiclient_key is not set" }
    }
    if(!_env.LIU_WX_GZ_APPID) {
      return { code: "E4001", errMsg: "wx gzh appid is not set" }
    }
  }

}

function getWxpayJsapiParams(
  prepay_id: string,
): Wxpay_Jsapi_Params {
  // 1. get params
  const _env = process.env
  const appid = _env.LIU_WX_GZ_APPID as string
  const stamp = Math.floor(getNowStamp() / 1000)
  const nonceStr = createEncNonce()
  const p = `prepay_id=${prepay_id}`

  // 2. construct message
  const msg = appid + "\n" + stamp + "\n" + nonceStr + "\n" + p + "\n"

  // 3. get signature
  const sign3 = crypto.createSign("sha256WithRSAEncryption").update(msg)
  const paySign = sign3.sign(wxpay_apiclient_key, "base64")

  return {
    appId: appid,
    timeStamp: String(stamp),
    nonceStr,
    package: p,
    signType: "RSA",
    paySign,
  }
}