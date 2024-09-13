// Function Name: webhook-wxpay
// Receive messages and events from Weixin Pay
import cloud from '@lafjs/cloud'
import { valTool, WxpayHandler } from '@/common-util'
import { 
  wxpay_apiclient_key, 
  wxpay_apiclient_serial_no,
} from "@/secret-config"
import type { LiuErrReturn, WxpayVerifySignOpt } from "@/common-types"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("webhook-wxpay invoked!")

  // 1. check out the signature
  const err1 = await checkFromWxpay(ctx)
  if(err1) {
    return err1
  }

  // 2. decrypt


  

  return { code: "0000" }
}


async function checkFromWxpay(
  ctx: FunctionContext
): Promise<LiuErrReturn | undefined> {
  // 1. get params from headers
  const headers = ctx.headers ?? {}
  const signature = headers["wechatpay-signature"]
  const timestamp = headers["wechatpay-timestamp"]    // seconds
  const nonce = headers["wechatpay-nonce"]
  const serial = headers["wechatpay-serial-no"]
  console.log("wxpay signature: ", signature)
  console.log("wxpay timestamp: ", timestamp)
  console.log("wxpay nonce: ", nonce)
  console.log("wxpay serial: ", serial)

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

  // 4. check out the signature
  const opt4: WxpayVerifySignOpt = {
    timestamp,
    nonce,
    signature,
    serial,
    body: ctx.body,
  }
  const res4 = WxpayHandler.verifySign(opt4)
  if(!res4) {
    return { code: "E4003", errMsg: "verify sign failed" }
  }
  
}