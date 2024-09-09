import cloud from "@lafjs/cloud"
import { 
  verifyToken,
  checker,
  createAvailableOrderId,
  getDocAddId,
  valTool,
  liuReq,
  transformStampIntoRFC3339,
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
  Wxpay_Order_Jsapi,
  Res_PO_WxpayJsapi,
} from "@/common-types"
import * as vbot from "valibot"
import * as crypto from "crypto"
import { getBasicStampWhileAdding, getNowStamp, MINUTE } from "@/common-time"
import { 
  wxpay_apiclient_serial_no,
  wxpay_apiclient_cert, 
  wxpay_apiclient_key,
} from "@/secret-config"
import { createEncNonce, createPaymentNonce, createRandom } from "@/common-ids"
import { useI18n, commonLang } from "@/common-i18n"

const db = cloud.database()
const _ = db.command

const MIN_3 = MINUTE * 3
const MIN_15 = MINUTE * 15
const MIN_30 = MINUTE * 30

const WXPAY_DOMAIN = "https://api.mch.weixin.qq.com"
const WXPAY_JSAPI_PATH = "/v3/pay/transactions/jsapi"
const WXPAY_JSAPI_ORDER = WXPAY_DOMAIN + WXPAY_JSAPI_PATH

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
    res2 = await handle_create_sp_order(body, user)
  }
  else if(oT === "get_order") {

  }
  else if(oT === "wxpay_jsapi") {
    res2 = await handle_wxpay_jsapi(body)
  }

  return res2
}


async function handle_wxpay_jsapi(
  body: Record<string, any>,
): Promise<LiuRqReturn<Res_PO_WxpayJsapi>> {
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
  if(!d1.plan_id) {
    return { code: "E4004", errMsg: "subscription plan not found" }
  }
  
  // 3. check out if we need to invoke JSAPI
  const wxData = d1.wxpay_other_data ?? {}
  let out_trade_no = wxData.jsapi_out_trade_no ?? ""
  let openid = wxData.jsapi_openid ?? ""
  let prepay_id = wxData.jsapi_prepay_id
  let created_stamp = wxData.jsapi_created_stamp ?? 1
  const diff3 = now2 - created_stamp
  if(!out_trade_no) prepay_id = ""
  if(wx_gzh_openid !== openid) prepay_id = ""
  if(diff3 > MIN_15) prepay_id = ""

  // 4. to get prepay_id
  if(!prepay_id) {

    // 4.1 get subscription
    const subPlan = await getSubscriptionPlan(d1.plan_id)
    if(!subPlan) {
      return { code: "E4004", errMsg: "fail to get sub plan" }
    }
    if(!subPlan.wxpay || subPlan.wxpay?.isOn !== "Y") {
      return { code: "E4003", errMsg: "wxpay for this sub plan is not supported" }
    }

    // 4.2 get sub plan info
    const now4_2 = getNowStamp()
    const res4_2 = getRequiredDataForPayment("wxpay_jsapi", d1, subPlan, body)
    const d4_2 = res4_2.data
    if(res4_2.code !== "0000" || !d4_2) {
      return res4_2 as LiuErrReturn
    }

    // 4.3 get prepay_id
    const param4_3: WxpayOrderByJsapiParam = {
      out_trade_no: d4_2.out_trade_no,
      openid: wx_gzh_openid,
      fee: d4_2.fee,
      description: d4_2.payment_title,
      expireStamp: d4_2.expireStamp,
    }
    prepay_id = await wxpayOrderByJsapi(param4_3)
    if(!prepay_id) {
      console.warn("fail to get prepay_id in wxpay_jsapi")
      console.log(param4_3)
      return { code: "E5001", errMsg: "fail to get prepay_id" }
    }

    // 4.4 storage prepay_id
    const now4_4 = getNowStamp()
    wxData.jsapi_out_trade_no = d4_2.out_trade_no
    wxData.jsapi_openid = wx_gzh_openid
    wxData.jsapi_prepay_id = prepay_id
    wxData.jsapi_created_stamp = now4_2
    const w4_4: Partial<Table_Order> = {
      wxpay_other_data: wxData,
      updatedStamp: now4_4,
    }
    oCol.doc(d1._id).update(w4_4)
  }

  // 5. get return data
  const data5 = getWxpayJsapiParams(prepay_id)

  return {
    code: "0000",
    data: {
      operateType: "wxpay_jsapi",
      param: data5,
    }
  }
}


// create subscription order
async function handle_create_sp_order(
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
  const d = res.data
  if(!d) return
  if(d.isOn !== "Y") return
  return d
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
    if(!wxpay_apiclient_serial_no) {
      return { code: "E4001", errMsg: "wxpay_apiclient_serial_no is not set" }
    }
    if(!wxpay_apiclient_cert) {
      return { code: "E4001", errMsg: "wxpay_apiclient_cert is not set" }
    }
    if(!wxpay_apiclient_key) {
      return { code: "E4001", errMsg: "wxpay_apiclient_key is not set" }
    }
    if(!_env.LIU_WX_GZ_APPID) {
      return { code: "E4001", errMsg: "wx gzh appid is not set" }
    }
    if(!_env.LIU_WXPAY_MCH_ID) {
      return { code: "E4001", errMsg: "wxpay mchid is not set" }
    }
    if(!_env.LIU_WXPAY_NOTIFY_URL) {
      return { code: "E4001", errMsg: "wxpay notify url is not set" }
    }
  }

}


interface RequiredDataForPayment {
  payment_title: string
  fee: number
  out_trade_no: string
  expireStamp: number
}

type PaymentType = "wxpay_jsapi" | "wxpay_h5" | "wxpay_native"

function getRequiredDataForPayment(
  payment_type: PaymentType,
  order: Table_Order,
  sub_plan: Table_Subscription,
  body: Record<string, any>,
): LiuRqReturn<RequiredDataForPayment> {
  const order_id = order.order_id
  let expireStamp = getNowStamp() + MIN_15
  if(order.expireStamp) {
    if(order.expireStamp < expireStamp) {
      expireStamp = order.expireStamp
    }
  }

  const { t } = useI18n(commonLang, { body })
  const payment_title = t("payment_title")
  let fee = sub_plan.amount_CNY
  let out_trade_no = ""

  const nonce = createRandom(4, "onlyLowercase", { no_l_o: true })
  if(payment_type === "wxpay_jsapi") {
    fee = sub_plan.wxpay?.amount_CNY ?? fee
    out_trade_no = `w1${nonce}${order_id}`
  }
  else if(payment_type === "wxpay_h5") {
    fee = sub_plan.wxpay?.amount_CNY ?? fee
    out_trade_no = `w2${nonce}${order_id}`
  }
  else if(payment_type === "wxpay_native") {
    fee = sub_plan.wxpay?.amount_CNY ?? fee
    out_trade_no = `w3${nonce}${order_id}`
  }

  if(!fee) {
    return { code: "E5001", errMsg: "fail to get fee" }
  }
  if(!out_trade_no) {
    return { code: "E5001", errMsg: "fail to get out_trade_no" }
  }
  if(!payment_title) {
    return { code: "E5001", errMsg: "fail to get payment_title" }
  }

  return { 
    code: "0000", 
    data: { 
      payment_title, 
      fee, 
      out_trade_no,
      expireStamp,
    }
  }
}

interface WxpayOrderByJsapiParam {
  out_trade_no: string
  openid: string
  fee: number      // unit: cent
  description: string
  attach?: string
  expireStamp?: number
}

async function wxpayOrderByJsapi(
  param: WxpayOrderByJsapiParam,
) {
  const _env = process.env
  const wx_appid = _env.LIU_WX_GZ_APPID as string
  const wx_mchid = _env.LIU_WXPAY_MCH_ID as string
  const wxpay_notify_url = _env.LIU_WXPAY_NOTIFY_URL as string
  let time_expire: string | undefined
  if(param.expireStamp) {
    time_expire = transformStampIntoRFC3339(param.expireStamp)
  }

  const body: Wxpay_Order_Jsapi = {
    appid: wx_appid,
    mchid: wx_mchid,
    notify_url: wxpay_notify_url,
    out_trade_no: param.out_trade_no,
    description: param.description,
    amount: {
      total: param.fee,
    },
    payer: {
      openid: param.openid,
    }
  }
  if(param.attach) body.attach = param.attach
  if(time_expire) body.time_expire = time_expire

  const Authorization = getWxpayReqAuthorization("POST", body, WXPAY_JSAPI_PATH)
  const headers = { Authorization }
  const res = await liuReq(WXPAY_JSAPI_ORDER, body, { headers })
  const { code, data } = res
  if(code !== "0000" || !data) {
    console.warn("fail to invoke wxpay jsapi")
    console.log(res)
    return
  }
  const prepay_id = data?.prepay_id as string
  return prepay_id
}

function getWxpayReqAuthorization(
  method: "POST" | "GET",
  body: Record<string, any>,
  path: string,
) {
  const timestamp = Math.floor(getNowStamp() / 1000)
  const nonce = createPaymentNonce()
  const bodyStr = valTool.objToStr(body)
  const msg = `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyStr}\n`

  const tmpSign = crypto.createSign("sha256WithRSAEncryption").update(msg)
  const signature = tmpSign.sign(wxpay_apiclient_key, "base64")

  console.log("getWxpayReqAuthorization signature: ")
  console.log(signature)

  const _env = process.env
  const wx_mchid = _env.LIU_WXPAY_MCH_ID as string

  let reqAuth = `WECHATPAY2-SHA256-RSA2048 `
  reqAuth += `mchid="${wx_mchid}",`
  reqAuth += `nonce_str="${nonce}",`
  reqAuth += `signature="${signature}",`
  reqAuth += `timestamp="${timestamp}",`
  reqAuth += `serial_no="${wxpay_apiclient_serial_no}"`

  console.log("getWxpayReqAuthorization reqAuth: ")
  console.log(reqAuth)

  return reqAuth
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