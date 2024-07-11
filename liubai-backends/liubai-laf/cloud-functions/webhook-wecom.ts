// Receive messages and events from WeCom
import cloud from "@lafjs/cloud";
import * as crypto from "crypto";
import { type LiuRqReturn } from "./common-types";
import { decrypt, getSignature } from "@wecom/crypto"
import xml2js from "xml2js"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("webhook-wecom starts to run!")

  const b = ctx.body
  console.log("ctx.body: ", b)

  const q = ctx.query
  console.log("ctx.query: ", q)

  // 0. preCheck
  const res0 = preCheck()
  if(res0) {
    return res0
  }

  // 1. get query
  const msg_signature = q?.msg_signature as string
  const timestamp = q?.timestamp as string
  const nonce = q?.nonce as string
  const echostr = q?.echostr as string

  // 2. echostr if we just init the program
  const method = ctx.method
  if(method === "GET" && echostr) {
    const res2_1 = verifyMsgSignature(msg_signature, timestamp, nonce, echostr)
    if(res2_1) return res2_1
    const res2_2 = toDecrypt(echostr)
    console.log("res2_2.message from wecom:")
    console.log(res2_2.message)
    return res2_2.message
  }

  return { code: "0000" }
}

function preCheck(): LiuRqReturn | undefined {
  const _env = process.env
  const token = _env.LIU_WECOM_INNER_TOKEN
  if(!token) {
    return { code: "E5001", errMsg: "LIU_WECOM_INNER_TOKEN is empty" }
  }
  const key = _env.LIU_WECOM_INNER_ENCODING_AESKEY
  if(!key) {
    return { code: "E5001", errMsg: "LIU_WECOM_INNER_ENCODING_AESKEY is empty" }
  }
}

function toDecrypt(
  ciphertext: string,
) {
  const _env = process.env
  const encodeingAESKey = _env.LIU_WECOM_INNER_ENCODING_AESKEY as string

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


function verifyMsgSignature(
  msg_signature: string, 
  timestamp: string, 
  nonce: string,
  ciphertext: string,
): LiuRqReturn | undefined {
  const _env = process.env
  const token = _env.LIU_WECOM_INNER_TOKEN as string
  const sig = getSignature(token, timestamp, nonce, ciphertext)

  if(sig !== msg_signature) {
    console.warn("msg_signature verification failed")
    console.log("calculated msg_signature: ", sig)
    console.log("received msg_signature: ", msg_signature)
    return { code: "E4003", errMsg: "msg_signature verification failed" }
  }
}
