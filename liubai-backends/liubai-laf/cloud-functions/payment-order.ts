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
  Partial_Id,
  PartialSth,
  Sch_Param_PaymentOrder,
  Table_Subscription,
} from "@/common-types"
import * as vbot from "valibot"
import { getBasicStampWhileAdding, getNowStamp, MINUTE } from "@/common-time"
import { wxpay_apiclient_cert } from "@/secret-config"

const db = cloud.database()
const _ = db.command

const MIN_3 = MINUTE * 3
const MIN_30 = MINUTE * 30

export async function main(ctx: FunctionContext) {

  // 1. check out body
  const body = ctx.request?.body ?? {}
  const err1 = checkBody(ctx, body)
  if(err1) return err1

  // 2. go to specific operation
  const oT = body.operateType as string
  if(oT === "create_order") {
    // check out token
    const vRes = await verifyToken(ctx, body)
    if(!vRes.pass) return vRes.rqReturn
    const user = vRes.userData
    create_sp_order(body, user)

  }
  else if(oT === "get_order") {

  }
  else if(oT === "wxpay_jsapi") {

  }



  return true
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
  const oT = body.operateType as string
  if(oT === "wxpay_jsapi") {
    if(!wxpay_apiclient_cert) {
      return { code: "E4001", errMsg: "wxpay_apiclient_cert is not set" }
    }
  }

}