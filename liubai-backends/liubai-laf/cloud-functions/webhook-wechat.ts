// Function Name: webhook-wechat
// Receive messages and events from WeChat subscription servers

import cloud from "@lafjs/cloud";
import * as crypto from "crypto";
import type { 
  LiuErrReturn, 
  LiuRqReturn,
  Table_Credential,
  Table_User,
  Wx_Gzh_Msg_Event, 
  Wx_Gzh_Scan, 
  Wx_Gzh_Subscribe, 
  Wx_Gzh_Unsubscribe,
  Wx_Res_GzhUserInfo, 
} from "@/common-types";
import { decrypt } from "@wecom/crypto"
import xml2js from "xml2js"
import { 
  getNowStamp, 
  isWithinMillis,
  MINUTE,
} from "@/common-time"
import { 
  getAccountName, 
  getWeChatAccessToken, 
  liuReq, 
  updateUserInCache,
} from "@/common-util";
import { useI18n, wechatLang } from "@/common-i18n"

const db = cloud.database()
let wechat_access_token = ""
let lastGetAccessTokenStamp = 0

/***************************** constants **************************/

// @see https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Service_Center_messages.html#7
const API_SEND = "https://api.weixin.qq.com/cgi-bin/message/custom/send"
const API_TYPING = "https://api.weixin.qq.com/cgi-bin/message/custom/typing"

// @see https://developers.weixin.qq.com/doc/offiaccount/User_Management/Get_users_basic_information_UnionID.html
const API_USER_INFO = "https://api.weixin.qq.com/cgi-bin/user/info"

// @see https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html#3
// get userinfo through web oAuth 2.0
const API_SNS_USERINFO = "https://api.weixin.qq.com/sns/userinfo"

const MIN_3 = 3 * MINUTE

/***************************** main **************************/
export async function main(ctx: FunctionContext) {
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

  const { MsgType } = msgObj
  if(MsgType === "event") {
    const { Event } = msgObj
    if(Event === "subscribe") {
      handle_subscribe(msgObj)
    }
    else if(Event === "SCAN") {
      handle_scan(msgObj)
    }
    else if(Event === "unsubscribe") {
      handle_unsubscribe(msgObj)
    }
  }
  
  // respond with empty string, and then wechat will not retry
  return ""
}


async function handle_unsubscribe(
  msgObj: Wx_Gzh_Unsubscribe,
) {
  const wx_gzh_openid = msgObj.FromUserName
  if(!wx_gzh_openid) return

  // 1. get the user
  const uCol = db.collection("User")
  const q1 = uCol.where({ wx_gzh_openid }).orderBy("insertedStamp", "desc")
  const res1 = await q1.getOne<Table_User>()
  const user = res1.data
  if(!user) return

  // 2. check if updating is required
  const oldSub = user.thirdData?.wx_gzh?.subscribe
  if(oldSub === 1) return

  // 3. update user
  const userId = user._id
  const thirdData = user.thirdData ?? {}
  const wx_gzh = thirdData.wx_gzh ?? {}
  wx_gzh.subscribe = 0
  thirdData.wx_gzh = wx_gzh
  const now = getNowStamp()
  const u3: Partial<Table_User> = {
    thirdData,
    updatedStamp: now,
  }
  const res3 = await uCol.doc(userId).update(u3)
  console.log("handle_unsubscribe: ")
  console.log(res3)

  // 4. update cache
  user.thirdData = thirdData
  user.updatedStamp = now
  updateUserInCache(userId, user)

  return true
}
 
async function handle_subscribe(
  msgObj: Wx_Gzh_Subscribe,
) {
  // 1. checking out access_token
  const res1 = await checkAccessToken()
  if(!res1) return

  // 2. get openid
  const wx_gzh_openid = msgObj.FromUserName
  if(!wx_gzh_openid) return

  // 3. get user info
  const userInfo = await get_user_info(wx_gzh_openid)

  // 4. send welcome message
  send_welcome(wx_gzh_openid, userInfo)

  // 5. get EventKey, and extract state
  const res5 = getDirectionCredential(msgObj.EventKey, "qrscene_")
  if(!res5) {
    make_user_subscribed(wx_gzh_openid, userInfo)
    return
  }
  const { direction, credential } = res5

  // 6. decide which path to take
  if(direction === "b2") {
    // get to bind account
    bind_wechat_gzh(wx_gzh_openid, credential, userInfo)
  }
  else if(direction === "b3") {
    // continue with wechat gzh

  }

}

async function handle_scan(
  msgObj: Wx_Gzh_Scan,
) {
  // 1. checking out access_token
  const res1 = await checkAccessToken()
  if(!res1) return

  // 2. get openid
  const wx_gzh_openid = msgObj.FromUserName
  if(!wx_gzh_openid) return

  // 3. get user info
  const userInfo = await get_user_info(wx_gzh_openid)

  // 4. get state
  const res4 = getDirectionCredential(msgObj.EventKey)
  if(!res4) return
  const { direction, credential } = res4

  // 5. decide which path to take
  if(direction === "b2") {
    // get to bind account
    bind_wechat_gzh(wx_gzh_openid, credential, userInfo)
  }
  else if(direction === "b3") {
    // continue with wechat gzh

  }

}


/***************** operations ****************/

async function bind_wechat_gzh(
  wx_gzh_openid: string,
  credential: string,
  userInfo?: Wx_Res_GzhUserInfo,
) {
  const cCol = db.collection("Credential")

  // 0.1 define some functions
  const _clearCredential = async (id: string) => {
    const res0_1 = await cCol.doc(id).remove()
    console.log("_clearCredential: ")
    console.log(res0_1)
  }

  // 1. get the credential
  const w1: Partial<Table_Credential> = {
    credential,
    infoType: "bind-wechat",
  }
  const q1 = cCol.where(w1)
  const res1 = await q1.getOne<Table_Credential>()
  const data1 = res1.data
  if(!data1) return false

  // 2. check if it is available
  const { expireStamp, userId } = data1
  if(!userId) {
    console.warn("bind_wechat_gzh: userId is null")
    console.log(data1)
    return false
  }
  if(!isWithinMillis(expireStamp, MINUTE)) {
    console.warn("bind_wechat_gzh: credential expired")
    console.log(data1)
    console.log("now: ", getNowStamp())
    return false
  }

  // 3. get the user
  const uCol = db.collection("User")
  const res3 = await uCol.doc(userId).get<Table_User>()
  const user3 = res3.data
  if(!user3) return false

  // 4. get i18n
  const { t } = useI18n(wechatLang, { user: user3 })
  const success_msg = t("success_1")

  // 5. if the user's wx_gzh_openid is equal to the current one
  if(user3.wx_gzh_openid === wx_gzh_openid) {
    send_text_to_wechat_gzh(wx_gzh_openid, success_msg)
    await make_user_subscribed(wx_gzh_openid, userInfo, user3)
    await _clearCredential(data1._id)
    return true
  }

  // 6. check out another user whose wx_gzh_openid 
  // matches the current one
  const w6: Partial<Table_User> = {
    wx_gzh_openid,
  }
  const q6 = uCol.where(w6).orderBy("insertedStamp", "desc")
  const res6 = await q6.getOne<Table_User>()
  const user6 = res6.data
  if(user6) {
    const name6 = await getAccountName(user6)
    const already_bound_msg = t("already_bound", { account: name6 })
    send_text_to_wechat_gzh(wx_gzh_openid, already_bound_msg)
    return false
  }

  // 7. everything is ok
  send_text_to_wechat_gzh(wx_gzh_openid, success_msg)
  await make_user_subscribed(wx_gzh_openid, userInfo, user3)
  await _clearCredential(data1._id)

  return true
}


async function send_welcome(
  wx_gzh_openid: string,
  userInfo?: Wx_Res_GzhUserInfo,
) {
  // 1. get language
  const lang = userInfo?.language

  // 2. i18n
  const { t } = useI18n(wechatLang, { lang })
  const text = t("welcome_1")
  
  // 3. reply user with text
  await send_text_to_wechat_gzh(wx_gzh_openid, text)

  return true
}


async function send_text_to_wechat_gzh(
  wx_gzh_openid: string,
  text: string,
) {
  const body = {
    touser: wx_gzh_openid,
    msgtype: "text",
    text: {
      content: text,
    }
  }
  const url = new URL(API_SEND)
  url.searchParams.set("access_token", wechat_access_token)
  const link = url.toString()
  const res = await liuReq(link, body)
  console.log("send_text_to_wechat_gzh res: ")
  console.log(res)
}

async function make_user_subscribed(
  wx_gzh_openid: string,
  userInfo?: Wx_Res_GzhUserInfo,
  user?: Table_User,
) {
  const uCol = db.collection("User")

  // 1. get user
  if(!user) {  
    const w1: Partial<Table_User> = { wx_gzh_openid }
    const q1 = uCol.where(w1).orderBy("insertedStamp", "desc")
    const res1 = await q1.getOne<Table_User>()
    if(!res1.data) return false
    user = res1.data
  }

  // 2. check if updating is required
  let needUpdate = false
  const userId = user._id
  const thirdData = user.thirdData ?? {}
  const wx_gzh = user.thirdData?.wx_gzh ?? {}
  if(wx_gzh.subscribe !== 1) {
    needUpdate = true
    wx_gzh.subscribe = 1
  }
  if(user.wx_gzh_openid !== wx_gzh_openid) {
    needUpdate = true
  }

  const newLang = userInfo?.language
  if(newLang && newLang !== wx_gzh.language) {
    needUpdate = true
    wx_gzh.language = newLang
  }
  const newScene = userInfo?.subscribe_scene
  if(newScene && newScene !== wx_gzh.subscribe_scene) {
    needUpdate = true
    wx_gzh.subscribe_scene = newScene
  }
  const newSubTime = userInfo?.subscribe_time
  if(newSubTime && newSubTime !== wx_gzh.subscribe_time) {
    needUpdate = true
    wx_gzh.subscribe_time = newSubTime
  }
  if(!needUpdate) {
    console.warn("there is no need to update user")
    console.log(user)
    return false
  }
  thirdData.wx_gzh = wx_gzh

  // 3. update user for db
  const now = getNowStamp()
  const u3: Partial<Table_User> = {
    wx_gzh_openid,
    thirdData,
    updatedStamp: now,
  }
  const res3 = await uCol.doc(userId).update(u3)
  console.log("make_user_subscribed res3: ")
  console.log(res3)

  // 4. update cache
  user.wx_gzh_openid = wx_gzh_openid
  user.thirdData = thirdData
  user.updatedStamp = now
  updateUserInCache(userId, user)

  return true
}



/***************** helper functions *************/

async function get_user_info(
  wx_gzh_openid: string,
) {
  const url = new URL(API_USER_INFO)
  const sP = url.searchParams
  sP.set("access_token", wechat_access_token)
  sP.set("openid", wx_gzh_openid)
  const link = url.toString()
  const res1 = await liuReq<Wx_Res_GzhUserInfo>(link, undefined, { method: "GET" })
  console.log("get user info from wechat gzh: ")
  console.log(res1)
  const data1 = res1.data
  return data1
}


interface DirectionCredential {
  direction: string
  credential: string
}

// extract key and value from event_key
// for example event_key="qrscene_b"
function getDirectionCredential(
  event_key: string,
  prefix?: string,
): DirectionCredential | undefined {
  if(!event_key) return

  // 1. get state
  let state = ""
  if(prefix) {
    if(!event_key.startsWith(prefix)) return
    state = event_key.substring(prefix.length)
    if(!state) return
  }
  else {
    state = event_key
  }

  // 2. get direction and credential from state
  const tmp2 = state.split("=")
  if(tmp2.length !== 2) return

  const direction = tmp2[0]
  const credential = tmp2[1]
  if(!direction || !credential) return
  return { direction, credential }
}



// check out access_token
async function checkAccessToken() {
  if(isWithinMillis(lastGetAccessTokenStamp, MIN_3) && wechat_access_token) {
    return true
  }

  const res = await getWeChatAccessToken()
  if(!res) {
    console.warn("getWeChatAccessToken fails")
    return false
  }

  wechat_access_token = res
  lastGetAccessTokenStamp = getNowStamp()
  return true
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

/****************************** helper functions ******************************/

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