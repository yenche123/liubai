// Function Name: webhook-wecom
// Receive messages and events from WeCom
import cloud from "@lafjs/cloud";
import type { 
  LiuRqReturn,
  Ww_Add_External_Contact,
  Ww_Msg_Event,
} from "@/common-types";
import { decrypt, getSignature } from "@wecom/crypto"
import xml2js from "xml2js"
import { getIp } from "@/common-util";

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const ip = getIp(ctx)

  const b = ctx.body
  const q = ctx.query
  
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
    // console.warn("fails to verify msg_signature, send 403")
    // console.log("ip: ", ip)
    // console.log(" ")
    ctx.response?.status(403)
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

  console.log("msgObj: ")
  console.log(msgObj)

  if(!msgObj) {
    console.warn("fails to get msg object")
    return { code: "E5001", errMsg: "get msg object fail" }
  }
  
  

  // respond with empty string, and then wecom will not retry
  return ""
}


function handle_add_external_contact(
  msgObj: Ww_Add_External_Contact,
) {



}





/***************** helper functions *************/

async function getMsgObject(
  message: string
): Promise<Ww_Msg_Event | undefined> {
  let res: Ww_Msg_Event | undefined 
  const parser = new xml2js.Parser({explicitArray : false})
  try {
    const { xml } = await parser.parseStringPromise(message)
    res = xml as Ww_Msg_Event
  }
  catch(err) {
    console.warn("getMsgObject fails")
    console.log(err)
  }

  return res
}

function preCheck(): LiuRqReturn | undefined {
  const _env = process.env
  const token = _env.LIU_WECOM_CHAT_SYNC_TOKEN
  if(!token) {
    return { code: "E5001", errMsg: "LIU_WECOM_CHAT_SYNC_TOKEN is empty" }
  }
  const key = _env.LIU_WECOM_CHAT_SYNC_ENCODING_AESKEY
  if(!key) {
    return { code: "E5001", errMsg: "LIU_WECOM_CHAT_SYNC_ENCODING_AESKEY is empty" }
  }
}

function toDecrypt(
  ciphertext: string,
) {
  const _env = process.env
  const encodeingAESKey = _env.LIU_WECOM_CHAT_SYNC_ENCODING_AESKEY as string

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
  const token = _env.LIU_WECOM_CHAT_SYNC_TOKEN as string
  const sig = getSignature(token, timestamp, nonce, ciphertext)

  if(sig !== msg_signature) {
    // console.warn("msg_signature verification failed")
    // console.log("calculated msg_signature: ", sig)
    // console.log("received msg_signature: ", msg_signature)
    return { code: "E4003", errMsg: "msg_signature verification failed" }
  }
}
