// Function Name: webhook-wechat
// Receive messages and events from WeChat subscription servers

import cloud from "@lafjs/cloud";
import * as crypto from "crypto";
import type { 
  LiuErrReturn, 
  LiuRqReturn,
  SupportedLocale,
  Table_Credential,
  Table_Member,
  Table_User,
  UserThirdData,
  UserWeChatGzh,
  Wx_Gzh_Msg_Event, 
  Wx_Gzh_Scan, 
  Wx_Gzh_Subscribe, 
  Wx_Gzh_Text, 
  Wx_Gzh_Unsubscribe,
  Wx_Res_Common,
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
  checkAndGetWxGzhAccessToken,
  liuReq, 
  updateUserInCache,
} from "@/common-util";
import { getCurrentLocale, useI18n, wechatLang } from "@/common-i18n"
import { wechat_tag_cfg } from "@/common-config";
import { createCredential2 } from "@/common-ids";
import { init_user } from "@/user-login";
import { sendWxTextMessage } from "@/service-send";

const db = cloud.database()
let wechat_access_token = ""

/***************************** constants **************************/
// how many accounts can be bound to one wechat gzh openid
const MAX_ACCOUNTS_TO_BIND = 2

// @see https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Service_Center_messages.html#7
const API_TYPING = "https://api.weixin.qq.com/cgi-bin/message/custom/typing"
const API_TAG_USER = "https://api.weixin.qq.com/cgi-bin/tags/members/batchtagging"
const API_UNTAG_USER = "https://api.weixin.qq.com/cgi-bin/tags/members/batchuntagging"

// @see https://developers.weixin.qq.com/doc/offiaccount/User_Management/Get_users_basic_information_UnionID.html
const API_USER_INFO = "https://api.weixin.qq.com/cgi-bin/user/info"

/***************************** types **************************/
type MsgMode = "plain_text" | "safe"

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
  if(MsgType === "text") {
    handle_text(msgObj)
  }
  else if(MsgType === "event") {
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


async function handle_text(
  msgObj: Wx_Gzh_Text,
) {
  // TODO
  
}


async function handle_unsubscribe(
  msgObj: Wx_Gzh_Unsubscribe,
) {
  const wx_gzh_openid = msgObj.FromUserName
  if(!wx_gzh_openid) return

  // 0. define functions where we update user and cache
  const uCol = db.collection("User")
  const _updateUser = async (user: Table_User) => {
    // 0.1 check if updating is required
    const oldSub = user.thirdData?.wx_gzh?.subscribe
    if(oldSub === 0) return

    // 0.2 update user
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

    // 0.3 update cache
    user.thirdData = thirdData
    user.updatedStamp = now
    updateUserInCache(userId, user)
  }

  // 1. get the user
  const q1 = uCol.where({ wx_gzh_openid }).orderBy("insertedStamp", "desc")
  const res1 = await q1.get<Table_User>()
  const list1 = res1.data
  const len1 = list1.length
  if(len1 < 1) return

  // 2. to update
  for(let i = 0; i < len1; i++) {
    const user = list1[i]
    if(i > (MAX_ACCOUNTS_TO_BIND - 1)) break
    await _updateUser(user)
  }

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
    login_with_wechat_gzh(wx_gzh_openid, credential, userInfo)
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
    login_with_wechat_gzh(wx_gzh_openid, credential, userInfo)
  }

}


/***************** operations ****************/

async function login_with_wechat_gzh(
  wx_gzh_openid: string,
  credential: string,
  userInfo?: Wx_Res_GzhUserInfo,
) {
  // 1. get credential
  const cCol = db.collection("Credential")
  const w1: Partial<Table_Credential> = {
    credential,
    infoType: "wx-gzh-scan",
  }
  const q1 = cCol.where(w1)
  const res1 = await q1.getOne<Table_Credential>()
  const data1 = res1.data
  if(!data1) return false
  const cId = data1._id
  const meta_data = data1.meta_data ?? {}

  // 2. define some functions
  // 2.1 set credential_2
  const _setCredential2 = async () => {
    const cred_2 = createCredential2()
    meta_data.wx_gzh_openid = wx_gzh_openid
    const w2: Partial<Table_Credential> = {
      credential_2: cred_2,
      meta_data,
      updatedStamp: getNowStamp(),
    }
    const res2 = await cCol.doc(cId).update(w2)
  }

  // 3. get user by wx_gzh_openid
  const uCol = db.collection("User")
  const w3: Partial<Table_User> = { wx_gzh_openid }
  const q3 = uCol.where(w3)
  const res3 = await q3.getOne<Table_User>()
  const user3 = res3.data
  if(user3) {
    _setCredential2()
    return
  }

  // 4. create user
  const body = {
    x_liu_theme: meta_data.x_liu_theme,
    x_liu_language: meta_data.x_liu_language,
  }
  let thirdData: UserThirdData | undefined
  if(userInfo) {
    const wx_gzh: UserWeChatGzh = {
      subscribe: userInfo.subscribe,
      language: userInfo.language,
      subscribe_time: userInfo.subscribe_time,
      subscribe_scene: userInfo.subscribe_scene,
    }
    thirdData = { wx_gzh }
  }
  const res4 = await init_user(body, { wx_gzh_openid }, thirdData)
  console.log("init_user: ")
  console.log(res4.data)

  // 5. set credential_2
  _setCredential2()
}


async function bind_wechat_gzh(
  wx_gzh_openid: string,
  credential: string,
  userInfo?: Wx_Res_GzhUserInfo,
) {
  const cCol = db.collection("Credential")
  const mCol = db.collection("Member")

  // 0. define some functions
  // 0.1 clear credential
  const _clearCredential = async (id: string) => {
    const res0_1 = await cCol.doc(id).remove()
  }

  // 0.2 make member's notification opened
  const _openWeChatNotification = async (id: string) => {

    // 1. get member
    const res0_2_1 = await mCol.doc(id).get<Table_Member>()
    const member = res0_2_1.data
    if(!member) {
      console.warn("member not found")
      return
    }
    const oldNoti = member.notification?.wx_gzh_toggle
    if(oldNoti) return

    // 2. update member
    const noti = member.notification ?? {}
    noti.wx_gzh_toggle = true
    const now0_2 = getNowStamp()
    const u0_2: Partial<Table_Member> = {
      notification: noti,
      updatedStamp: now0_2,
    }
    const res0_2_2 = await mCol.doc(id).update(u0_2)
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
  const memberId_1 = data1.meta_data?.memberId

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

  // 4.1 define successful logic
  const _success = async () => {
    send_text_to_wechat_gzh(wx_gzh_openid, success_msg)
    await make_user_subscribed(wx_gzh_openid, userInfo, user3)
    if(memberId_1) {
      await _openWeChatNotification(memberId_1)
    }
    await _clearCredential(data1._id)
    await tag_user_lang(wx_gzh_openid, user3, userInfo)
  }
  
  // 5. if the user's wx_gzh_openid is equal to the current one
  if(user3.wx_gzh_openid === wx_gzh_openid) {
    await _success()
    return true
  }

  // 6. check out another user whose wx_gzh_openid 
  // matches the current one
  const w6: Partial<Table_User> = {
    wx_gzh_openid,
  }
  const q6 = uCol.where(w6).orderBy("insertedStamp", "desc")
  const res6 = await q6.get<Table_User>()
  const list6 = res6.data

  // binding two accounts is allowed, but binding three is not
  const len6 = list6.length
  if(len6 > (MAX_ACCOUNTS_TO_BIND - 1)) {
    const user6 = list6[0]
    const name6 = await getAccountName(user6)
    const already_bound_msg = t("already_bound", { account: name6 })
    send_text_to_wechat_gzh(wx_gzh_openid, already_bound_msg)
    return false
  }

  // 7. everything is ok
  await _success()

  return true
}

// tag bound user for language
export async function tag_user_lang(
  wx_gzh_openid: string,
  user: Table_User,
  userInfo?: Wx_Res_GzhUserInfo,
  oldLocale?: SupportedLocale,
) {
  const _env = process.env
  const tagManagement = _env.LIU_WX_GZ_TAG_MANAGEMENT
  if(tagManagement !== "01") {
    console.warn("tag mode is not enabled")
    return
  }

  // 0. get userInfo & check access_token
  if(!userInfo) {
    await checkAccessToken()
    userInfo = await get_user_info(wx_gzh_openid)
  }

  // 1. get target tagId
  const locale = getCurrentLocale({ user })
  const tagId = wechat_tag_cfg[locale]


  // 2. if oldLocale exists, untag
  const tags = userInfo?.tagid_list ?? []
  if(oldLocale && oldLocale !== locale) {
    const oldTagId = wechat_tag_cfg[oldLocale]
    const existed2 = tags.includes(oldTagId)
    if(oldTagId && existed2) {
      await untag_user(wx_gzh_openid, oldTagId)
    }
  }

  // 3. check if tagId has exists
  const existed3 = tags.includes(tagId)
  if(existed3) {
    return true
  }
  
  // 4. set tag
  const url4 = new URL(API_TAG_USER)
  url4.searchParams.set("access_token", wechat_access_token)
  const link4 = url4.toString()
  const q4 = {
    openid_list: [wx_gzh_openid],
    tagid: tagId,
  }
  const res3 = await liuReq<Wx_Res_Common>(link4, q4)
  const errcode = res3.data?.errcode
  if(errcode !== 0) {
    console.warn("tag user for wechat gzh failed")
    console.log(res3.data)
  }

  return true
}


async function untag_user(
  wx_gzh_openid: string,
  tagid: number,
) {
  const url = new URL(API_UNTAG_USER)
  url.searchParams.set("access_token", wechat_access_token)
  const link = url.toString()

  const q = {
    openid_list: [wx_gzh_openid],
    tagid,
  }
  const res = await liuReq<Wx_Res_Common>(link, q)
  const errcode = res.data?.errcode
  if(errcode !== 0) {
    console.warn("untag user for wechat gzh failed")
    console.log(res.data)
  }
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
  await sendWxTextMessage(wx_gzh_openid, wechat_access_token, text)
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

  // 4. update cache
  user.wx_gzh_openid = wx_gzh_openid
  user.thirdData = thirdData
  user.updatedStamp = now
  updateUserInCache(userId, user)

  return true
}



/***************** helper functions *************/

export async function get_user_info(
  wx_gzh_openid: string,
) {
  const url = new URL(API_USER_INFO)
  const sP = url.searchParams
  sP.set("access_token", wechat_access_token)
  sP.set("openid", wx_gzh_openid)
  const link = url.toString()
  const res1 = await liuReq<Wx_Res_GzhUserInfo>(link, undefined, { method: "GET" })
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
  wechat_access_token = await checkAndGetWxGzhAccessToken()
  return wechat_access_token
}


async function turnInputIntoMsgObj(
  ctx: FunctionContext,
): Promise<LiuRqReturn<Wx_Gzh_Msg_Event> | string> {
  const b = ctx.body
  const q = ctx.query
  
  // 0.1 which mode it is
  const msgMode = getMsgMode(q, b)
  if(msgMode === "plain_text" && b) {
    console.log("看一下 body.xml: ")
    console.log(b.xml)
  }

  // 0.2 preCheck
  const res0 = preCheck(msgMode)
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
    const res2_1 = verifySignature(signature, timestamp, nonce)
    if(res2_1) return res2_1
    return echostr
  }

  // 3. try to get ciphertext, which applys to most scenarios
  const payload = b?.xml
  if(!payload) {
    console.warn("fails to get xml in body")
    return { code: "E4000", errMsg: "xml in body is required" }
  }
  const ciphertext = payload.encrypt?.[0]
  if(msgMode === "safe" && !ciphertext) {
    console.warn("fails to get encrypt in body")
    return { code: "E4000", errMsg: "Encrypt in body is required"  }
  }

  // 4.1 verify msg_signature while it is safe mode
  if(msgMode === "safe") {
    const res4_1 = verifyMsgSignature(msg_signature, timestamp, nonce, ciphertext)
    if(res4_1) {
      console.warn("fails to verify msg_signature")
      console.log(res4_1)
      return res4_1
    }
  }
  else {
    const res4_2 = verifySignature(signature, timestamp, nonce)
    if(res4_2) {
      console.warn("fails to verify signature")
      console.log(res4_2)
      return res4_2
    }
  }

  let msgObj: Wx_Gzh_Msg_Event | undefined
  if(msgMode === "safe") {
    // 5. decrypt 
    const { message, id } = toDecrypt(ciphertext)

    if(!message) {
      console.warn("fails to get message")
      return { code: "E4000", errMsg: "decrypt fail" }
    }

    // 6. get msg object
    msgObj = await getMsgObjForSafeMode(message)
  }
  else {
    msgObj = getMsgObjForPlainText(payload)
  }

  if(!msgObj || !msgObj.MsgType) {
    console.warn("fails to get msg object")
    return { code: "E5001", errMsg: "get msg object fail" }
  }
  
  return { code: "0000", data: msgObj }
}

function getMsgObjForPlainText(
  xml: Record<string, Array<any>>,
) {
  let msgObj: any = {}
  if(xml.tousername) msgObj.ToUserName = xml.tousername[0]
  if(xml.fromusername) msgObj.FromUserName = xml.fromusername[0]
  if(xml.createtime) msgObj.CreateTime = xml.createtime[0]
  if(xml.msgtype) msgObj.MsgType = xml.msgtype[0]
  if(xml.event) msgObj.Event = xml.event[0]
  if(xml.eventkey) msgObj.EventKey = xml.eventkey[0]
  
  // auth change event
  if(xml.openid) msgObj.OpenID = xml.openid[0]
  if(xml.appid) msgObj.AppID = xml.appid[0]
  if(xml.revokeinfo) msgObj.RevokeInfo = xml.revokeinfo[0]

  if(xml.content) msgObj.Content = xml.content[0]
  if(xml.msgid) msgObj.MsgId = xml.msgid[0]
  if(xml.msgdataid) msgObj.MsgDataId = xml.msgdataid[0]

  if(xml.picurl) msgObj.PicUrl = xml.picurl[0]
  if(xml.mediaid) msgObj.MediaId = xml.mediaid[0]

  if(xml.format) msgObj.Format = xml.format[0]

  // msg menu
  if(xml.bizmsgmenuid) msgObj.bizmsgmenuid = xml.bizmsgmenuid[0]

  if(xml.ticket) msgObj.Ticket = xml.ticket[0]

  if(xml.menuid) msgObj.MenuId = xml.menuid[0]

  // template message sent
  if(xml.status) msgObj.Status = xml.status[0]

  // location
  if(xml.location_x) msgObj.Location_X = xml.location_x[0]
  if(xml.location_y) msgObj.Location_Y = xml.location_y[0]
  if(xml.scale) msgObj.Scale = xml.scale[0]
  if(xml.label) msgObj.Label = xml.label[0]

  // link
  if(xml.title) msgObj.Title = xml.title[0]
  if(xml.description) msgObj.Description = xml.description[0]
  if(xml.url) msgObj.Url = xml.url[0]

  // voice
  if(xml.recognition) msgObj.Recognition = xml.recognition[0]
  if(xml.mediaid16k) msgObj.MediaId16K = xml.mediaid16k[0]

  // video
  if(xml.thumbmediaid) msgObj.ThumbMediaId = xml.thumbmediaid[0]

  return msgObj as Wx_Gzh_Msg_Event
}

async function getMsgObjForSafeMode(message: string) {
  let res: Wx_Gzh_Msg_Event | undefined 
  const parser = new xml2js.Parser({explicitArray : false})
  try {
    const { xml } = await parser.parseStringPromise(message)
    res = xml
  }
  catch(err) {
    console.warn("getMsgObjForSafeMode fails")
    console.log(err)
  }

  return res
}

/****************************** helper functions ******************************/

function getMsgMode(
  q: Record<string, any>,
  b: Record<string, any>,
): MsgMode {
  const encrypt_type = q.encrypt_type
  const encrypt = b.xml.encrypt

  // console.log("encrypt_type: ", encrypt_type)
  // console.log("encrypt: ", encrypt)

  if(encrypt_type && encrypt) {
    return "safe"
  }
  
  return "plain_text"
}

function preCheck(
  msgMode: MsgMode,
): LiuErrReturn | undefined {
  const _env = process.env
  const token = _env.LIU_WX_GZ_TOKEN
  if(!token) {
    return { code: "E5001", errMsg: "LIU_WX_GZ_TOKEN is empty" }
  }
  const key = _env.LIU_WX_GZ_ENCODING_AESKEY
  if(!key && msgMode === "safe") {
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

  if(sig !== msg_signature) {
    console.warn("msg_signature verification failed")
    console.log("sig caculated: ", sig)
    console.log("msg_signature: ", msg_signature)
    return { code: "E4003", errMsg: "msg_signature verification failed" }
  }
}

function verifySignature(
  signature: string,
  timestamp: string, 
  nonce: string,
) {
  const _env = process.env
  const token = _env.LIU_WX_GZ_TOKEN as string
  const arr = [token, timestamp, nonce].sort()
  const str = arr.join('')
  const sha1 = crypto.createHash('sha1')
  sha1.update(str)
  const sig = sha1.digest('hex')
  if(sig !== signature) {
    console.warn("signature verification failed")
    console.log("sig caculated: ", sig)
    console.log("signature: ", signature)
    return { code: "E4003", errMsg: "signature verification failed" }
  }
}