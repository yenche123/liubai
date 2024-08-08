// Receive messages and events from WeChat subscription servers
import cloud from "@lafjs/cloud";
import * as crypto from "crypto";
import { LiuErrReturn, Wx_Gzh_Msg_Event, type LiuRqReturn } from "./common-types";
import { decrypt } from "@wecom/crypto"
import xml2js from "xml2js"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("webhook-wechat is called!")
  const res = await turnInputIntoMsgObj(ctx)
  if(typeof res === "string") {
    return res
  }
  const { data: msgObj, code } = res
  if(code !== "0000" || !msgObj) {
    return res
  }

  console.log("webhook-wechat successfully called......")
  console.log(msgObj)
  


  // respond with empty string, and then wechat will not retry
  return ""
}


async function turnInputIntoMsgObj(
  ctx: FunctionContext,
): Promise<LiuRqReturn<Wx_Gzh_Msg_Event> | string> {
  const b = ctx.body
  const q = ctx.query

  // 0. preCheck
  const res0 = preCheck()
  if(res0) {
    return res0
  }

  // 1. get query
  const msg_signature = q?.msg_signature as string
  const signature = q?.signature as string
  const timestamp = q?.timestamp as string
  const nonce = q?.nonce as string
  const echostr = q?.echostr as string

  // 2. echostr if we just init the program
  const method = ctx.method
  if(method === "GET" && echostr) {
    const res2_1 = verifyEchoStr(signature, timestamp, nonce)
    if(res2_1) return res2_1
    return echostr
  }


  // 3. try to get ciphertext, which applys to most scenarios
  const payload = b.xml
  if(!payload) {
    console.warn("fails to get xml in body")
    return { code: "E4000", errMsg: "xml in body is required" }
  }
  const ciphertext = payload.encrypt?.[0]
  if(!ciphertext) {
    console.warn("fails to get encrypt in body")
    return { code: "E4000", errMsg: "Encrypt in body is required"  }
  }

  // 4. verify msg_signature
  const res4 = verifyMsgSignature(msg_signature, timestamp, nonce, ciphertext)
  if(res4) {
    console.warn("fails to verify msg_signature")
    console.log(res4)
    return res4
  }

  // 5. decrypt 
  const { message, id } = toDecrypt(ciphertext)

  if(!message) {
    console.warn("fails to get message")
    return { code: "E4000", errMsg: "decrypt fail" }
  }

  // 6. get msg object
  const msgObj = await getMsgObject(message)

  if(!msgObj) {
    console.warn("fails to get msg object")
    return { code: "E5001", errMsg: "get msg object fail" }
  }
  
  return { code: "0000", data: msgObj }
}


async function getMsgObject(message: string) {
  let res: Wx_Gzh_Msg_Event | undefined 
  const parser = new xml2js.Parser({explicitArray : false})
  try {
    const { xml } = await parser.parseStringPromise(message)
    res = xml
  }
  catch(err) {
    console.warn("getMsgObject fails")
    console.log(err)
  }

  return res
}


function preCheck(): LiuErrReturn | undefined {
  const _env = process.env
  const token = _env.LIU_WX_GZ_TOKEN
  if(!token) {
    return { code: "E5001", errMsg: "LIU_WX_GZ_TOKEN is empty" }
  }
  const key = _env.LIU_WX_GZ_ENCODING_AESKEY
  if(!key) {
    return { code: "E5001", errMsg: "LIU_WX_GZ_ENCODING_AESKEY is empty" }
  }
}

function toDecrypt(
  ciphertext: string,
) {
  const _env = process.env
  const encodeingAESKey = _env.LIU_WX_GZ_ENCODING_AESKEY as string

  let message = ""
  let id = ""
  try {
    const data = decrypt(encodeingAESKey, ciphertext)
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
): LiuErrReturn | undefined {
  const _env = process.env
  const token = _env.LIU_WX_GZ_TOKEN as string
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


function verifyMsgSignature(
  msg_signature: string, 
  timestamp: string, 
  nonce: string,
  ciphertext: string,
): LiuErrReturn | undefined {
  const _env = process.env
  const token = _env.LIU_WX_GZ_TOKEN as string
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