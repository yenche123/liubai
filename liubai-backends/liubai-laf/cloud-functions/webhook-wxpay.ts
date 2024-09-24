// Function Name: webhook-wxpay
// Receive messages and events from Weixin Pay
import cloud from '@lafjs/cloud'
import { valTool, WxpayHandler } from '@/common-util'
import { 
  wxpay_apiclient_key, 
  wxpay_apiclient_serial_no,
} from "@/secret-config"
import type { 
  CommonPass, 
  LiuErrReturn, 
  Wxpay_Notice_Base, 
  Wxpay_Notice_Result, 
  WxpayVerifySignOpt,
} from "@/common-types"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("webhook-wxpay invoked!")

  // 0. [test] decrypt first
  const res0 = await decryptData(ctx)
  if(res0.pass) {
    console.warn("解密成功......")
    console.log(res0.data)
  }
  else {
    console.warn("解密失败......")
    console.log(res0.err)
    ctx.response?.status(403)
    return res0.err
  }
  
  // 1. check out the signature
  const err1 = await checkFromWxpay(ctx)
  if(err1) {
    console.warn("checkFromWxpay failed")
    console.log(err1)
    return err1
  }

  return { code: "0000" }
}

async function decryptData(
  ctx: FunctionContext,
): Promise<CommonPass<Wxpay_Notice_Result>> {
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
  console.log("check out headers for webhook-wxpay: ")
  console.log(headers)

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