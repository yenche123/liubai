// Function Name: webhook-wxpay
// Receive messages and events from Weixin Pay
import cloud from '@lafjs/cloud'
import { valTool } from '@/common-util'
import { 
  wxpay_apiclient_key, 
  wxpay_apiclient_serial_no,
} from "@/secret-config"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("webhook-wxpay invoked!")

  checkFromWxpay(ctx)

  return { code: "0000" }
}


function checkFromWxpay(ctx: FunctionContext) {
  const headers = ctx.headers ?? {}
  const signature = headers["x-wechatpay-signature"]
  const timestamp = headers["x-wechatpay-timestamp"]
  const nonce = headers["x-wechatpay-nonce"]
  console.log("wxpay signature: ", signature)
  console.log("wxpay timestamp: ", timestamp)
  console.log("wxpay nonce: ", nonce)

  if(!valTool.isStringWithVal(signature)) {
    return { code: "E4001", errMsg: "signature is empty" }
  }
  if(!valTool.isStringWithVal(timestamp)) {
    return { code: "E4002", errMsg: "timestamp is empty" }
  }
  if(!valTool.isStringWithVal(nonce)) {
    return { code: "E4003", errMsg: "nonce is empty" }
  }

  if(!wxpay_apiclient_key) {
    console.warn("wxpay_apiclient_key is not set")
    return { code: "E5001", errMsg: "wxpay_apiclient_key is not set" }
  }

  if(!wxpay_apiclient_serial_no) {
    console.warn("wxpay_apiclient_serial_no is not set")
    return { code: "E5002", errMsg: "wxpay_apiclient_serial_no is not set" }
  }

  
}