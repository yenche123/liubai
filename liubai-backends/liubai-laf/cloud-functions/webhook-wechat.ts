// Receive messages and events from WeChat subscription servers
import cloud from "@lafjs/cloud";
import * as crypto from "crypto";
import { type LiuRqReturn } from "./common-types";
import { decrypt } from "@wecom/crypto"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("webhook-wechat starts to run!")

  const b = ctx.body
  console.log("ctx.body: ", b)
  const b2 = ctx.request?.body
  console.log("ctx.request.body: ", b2)

  const q = ctx.query
  console.log("ctx.query: ", q)
  const q2 = ctx.request?.query
  console.log("ctx.request.query: ", q2)

  // 0. preCheck
  const res0 = preCheck()
  if(res0) {
    return res0
  }

  // 1. get query
  const msg_signature = q2?.msg_signature as string
  const signature = q2?.signature as string
  const timestamp = q2?.timestamp as string
  const nonce = q2?.nonce as string
  const echostr = q2?.echostr as string

  console.log("msg_signature: ", msg_signature)
  console.log("signature: ", signature)
  console.log("timestamp: ", timestamp)
  console.log("nonce: ", nonce)
  console.log("echostr: ", echostr)

  // 2. echostr if we just init the program
  const method = ctx.method
  if(method === "GET" && echostr) {
    const res2_1 = verifyEchoStr(signature, timestamp, nonce)
    if(res2_1) return res2_1
    return echostr
  }

  return { code: "0000", data: "success" }
}


function preCheck(): LiuRqReturn | undefined {
  const _env = process.env
  const token = _env.LIU_WECHAT_TOKEN
  if(!token) {
    return { code: "E5001", errMsg: "LIU_WECHAT_TOKEN is empty" }
  }
  const key = _env.LIU_WECHAT_ENCODING_AESKEY
  if(!key) {
    return { code: "E5001", errMsg: "LIU_WECHAT_ENCODING_AESKEY is empty" }
  }
}

function toDecrypt(
  ciphertext: string,
) {
  const _env = process.env
  const encodeingAESKey = _env.LIU_WECHAT_ENCODING_AESKEY as string

  let message = ""
  let id = ""
  try {
    const data = decrypt(encodeingAESKey, ciphertext)
    console.log("toDecrypt result: ")
    console.log(data)

    message = data.message
    id = data.id
  }
  catch(err) {
    console.warn("decrypt fail")
    console.log(err)
  }
  
  return { message, id }
}

function verifyEchoStr(
  signature: string, 
  timestamp: string, 
  nonce: string,
) {
  const _env = process.env
  const token = _env.LIU_WECHAT_TOKEN as string
  const arr = [token, timestamp, nonce].sort()

  const str = arr.join('')
  const sha1 = crypto.createHash('sha1')
  sha1.update(str)
  const sig = sha1.digest('hex')

  console.log("计算出来的 signature: ", sig)

  if(sig !== signature) {
    return { code: "E4003", errMsg: "signature verification failed" }
  }
}


function verifySignature(
  msg_signature: string, 
  timestamp: string, 
  nonce: string,
  ciphertext: string,
): LiuRqReturn | undefined {
  const _env = process.env
  const token = _env.LIU_WECHAT_TOKEN as string
  const arr = [token, timestamp, nonce, ciphertext].sort()
  const str = arr.join('')
  const sha1 = crypto.createHash('sha1')
  sha1.update(str)
  const sig = sha1.digest('hex')

  console.log("计算出来的 msg_signature: ", sig)

  if(sig !== msg_signature) {
    return { code: "E4003", errMsg: "msg_signature verification failed" }
  }
}