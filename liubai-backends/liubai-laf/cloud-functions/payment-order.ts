import cloud from "@lafjs/cloud"
import { 
  verifyToken,
  checker,
} from "@/common-util"
import {
  LiuErrReturn,
  Sch_Param_PaymentOrder,
  Table_Order,
  Table_User,
} from "@/common-types"
import * as vbot from "valibot"
import { getNowStamp, MINUTE } from "@/common-time"
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
    handle_create_order(body, user)

  }
  else if(oT === "get_order") {

  }
  else if(oT === "wxpay_jsapi") {

  }



  return true
}


async function handle_create_order(
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
  if(res2.data) {
    
  }






 
  



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