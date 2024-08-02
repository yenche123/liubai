// Function Name: webhook-wecom
// Receive messages and events from WeCom
import cloud from "@lafjs/cloud";
import type { 
  LiuRqReturn,
  Table_Config,
  Table_Credential,
  Table_User,
  Ww_Add_External_Contact,
  Ww_Msg_Event,
  Ww_Welcome_Body,
} from "@/common-types";
import { decrypt, getSignature } from "@wecom/crypto";
import xml2js from "xml2js";
import { getIp, liuReq, updateUserInCache } from "@/common-util";
import { useI18n, wecomLang } from "@/common-i18n";
import { getNowStamp } from "@/common-time";

const db = cloud.database()

/********* some constants *************/
const API_WECOM_SEND_WELCOME = "https://qyapi.weixin.qq.com/cgi-bin/externalcontact/send_welcome_msg"

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
  // const tousername = payload.tousername?.[0]
  // const agentid = payload.agentid?.[0]
  // console.log("tousername: ", tousername)
  // console.log("agentid: ", agentid)

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
  
  const { MsgType, Event } = msgObj
  if(MsgType === "event" && Event === "change_external_contact") {
    const { ChangeType } = msgObj
    if(ChangeType === "add_external_contact") {
      await handle_add_external_contact(msgObj)
    }
    else if(ChangeType === "del_follow_user") {

    }
    else if(ChangeType === "msg_audit_approved") {

    }
    
  }


  // respond with empty string, and then wecom will not retry
  return ""
}


// when user add WeCom Contact
async function handle_add_external_contact(
  msgObj: Ww_Add_External_Contact,
) {
  // 0. get params
  const {
    ExternalUserID,
    State,
    WelcomeCode,
  } = msgObj
  const { t: t0 } = useI18n(wecomLang)

  // 0.1 a function to return welcome_2
  const _when_no_state = async () => {
    if(!WelcomeCode) return
    const text = t0("welcome_2", { link: "TESTing" })
    await sendWelcomeMessage({
      welcome_code: WelcomeCode,
      text: { content: text },
    })
  }

  // 0.2 a function to return welcome_3 which means that
  // the original QR code is expired or invalid
  const _when_cred_err = async () => {
    if(!WelcomeCode) return
    const text = t0("welcome_3", { link: "TESTing" })
    await sendWelcomeMessage({
      welcome_code: WelcomeCode,
      text: { content: text },
    })
  }

  // 0.3 when the WeChat account has been bound
  const _when_bound = async () => {
    if(!WelcomeCode) return
    const text = t0("err_1")
    await sendWelcomeMessage({
      welcome_code: WelcomeCode,
      text: { content: text },
    })
  }


  // 1. if ExternalUserID is empty, return
  if(!ExternalUserID) {
    console.warn("fails to get ExternalUserID")
    console.log(msgObj)
    return { code: "E5002", errMsg: "ExternalUserID is empty" }
  }

  // 1.2 check if ExternalUserID has been bound
  const uCol = db.collection("User")
  const w1_2: Partial<Table_User> = {
    ww_qynb_external_userid: ExternalUserID,
  }
  const res1_2 = await uCol.where(w1_2).get<Table_User>()
  const list1_2 = res1_2.data
  if(list1_2.length > 0) {
    console.warn("ExternalUserID has been bound")
    console.log(list1_2)
    console.log(msgObj)
    _when_bound()
    return { code: "0000" }
  }

  // 2. return binding link if State is empty
  if(!State) {
    _when_no_state()
    return { code: "0000" }
  }

  // 3. parse state
  const isBindWecom = State.startsWith("b1=")
  if(!isBindWecom || State.length < 10) {
    console.warn("state looks weird: ", State)
    _when_no_state()
    return { code: "0000" }
  }

  // 4. get credential and query
  const cred = State.substring(3)
  const cCol = db.collection("Credential")
  const w4 = {
    credential: cred,
    infoType: "bind-wecom",
  }
  const res4 = await cCol.where(w4).get<Table_Credential>()

  // 5. check out if credential is valid
  const list5 = res4.data
  const c5 = list5[0]
  if(!c5) {
    _when_cred_err()
    return { code: "0000" }
  }
  const c5_id = c5._id

  // 6. if credential is expired
  const now = getNowStamp()
  if(now > c5.expireStamp) {
    _when_cred_err()
    return { code: "0000" }
  }

  // 7. get userId
  const userId = c5.userId
  if(!userId) {
    console.warn("userId in credential is empty")
    return { code: "E5001", errMsg: "userId is empty" }
  }

  // 8. get user
  const res8 = await uCol.doc(userId).get<Table_User>()
  const user = res8.data
  if(!user) {
    console.warn("there is no user")
    return { code: "E5001", errMsg: "there is no user" }
  }

  // 9. update user
  user.ww_qynb_external_userid = ExternalUserID
  user.updatedStamp = now
  const w9: Partial<Table_User> = {
    ww_qynb_external_userid: ExternalUserID,
    updatedStamp: now,
  }
  const res9 = await uCol.doc(userId).update(w9)
  console.log("update user res9: ")
  console.log(res9)
  updateUserInCache(userId, user)

  // 10. make cred expired
  const now10 = getNowStamp()
  const w10: Partial<Table_Credential> = {
    expireStamp: now10,
    updatedStamp: now10,
  }
  const res10 = await cCol.doc(c5_id).update(w10)
  console.log("make cred expired result: ")
  console.log(res10)


  // 11. send welcome_1
  // 根据 user 的语言构造 t()



  


}


async function sendWelcomeMessage(
  data: Ww_Welcome_Body,
): Promise<LiuRqReturn> {
  // 1. get access_token
  const access_token = await getWecomAccessToken()
  if(!access_token) {
    console.warn("there is no wecom access_token")
    return { code: "E5001", errMsg: "wecom access_token is empty" }
  }

  // 2. package url and body
  const url = new URL(API_WECOM_SEND_WELCOME)
  url.searchParams.set("access_token", access_token)
  const link = url.toString()
  const res2 = await liuReq(link, data)

  console.log("sendWelcomeMessage res2: ")
  console.log(res2)

  return { code: "0000" }
}


async function getWecomAccessToken() {
  const col = db.collection("Config")
  const res = await col.get<Table_Config>()
  const list = res.data
  let cfg = list[0]
  if(!cfg) return
  const access_token = cfg.wecom_qynb?.access_token
  return access_token
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
  const token = _env.LIU_WECOM_QYNB_TOKEN
  if(!token) {
    return { code: "E5001", errMsg: "LIU_WECOM_QYNB_TOKEN is empty" }
  }
  const key = _env.LIU_WECOM_QYNB_ENCODING_AESKEY
  if(!key) {
    return { code: "E5001", errMsg: "LIU_WECOM_QYNB_ENCODING_AESKEY is empty" }
  }
}

function toDecrypt(
  ciphertext: string,
) {
  const _env = process.env
  const encodeingAESKey = _env.LIU_WECOM_QYNB_ENCODING_AESKEY as string

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
  const token = _env.LIU_WECOM_QYNB_TOKEN as string
  const sig = getSignature(token, timestamp, nonce, ciphertext)

  if(sig !== msg_signature) {
    // console.warn("msg_signature verification failed")
    // console.log("calculated msg_signature: ", sig)
    // console.log("received msg_signature: ", msg_signature)
    return { code: "E4003", errMsg: "msg_signature verification failed" }
  }
}
