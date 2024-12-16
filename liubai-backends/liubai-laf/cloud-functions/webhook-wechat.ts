// Function Name: webhook-wechat
// Receive messages and events from WeChat subscription servers

import cloud from "@lafjs/cloud";
import * as crypto from "crypto";
import type { 
  LiuErrReturn, 
  LiuRqReturn,
  Table_Credential,
  Table_Member,
  Table_User,
  UserThirdData,
  UserWeChatGzh,
  Wx_Gzh_Click,
  Wx_Gzh_Image,
  Wx_Gzh_Link,
  Wx_Gzh_Location,
  Wx_Gzh_Msg_Event, 
  Wx_Gzh_Scan, 
  Wx_Gzh_Send_Msg, 
  Wx_Gzh_Subscribe, 
  Wx_Gzh_Text, 
  Wx_Gzh_Unsubscribe,
  Wx_Gzh_Video,
  Wx_Gzh_Voice,
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
  updateUserInCache,
  tagWxUserLang,
  getWxGzhUserInfo,
  isEmailAndNormalize,
  valTool,
} from "@/common-util";
import {
  useI18n, 
  i18nFill,
  wechatLang,
  wxClickReplies,
  wxTextRepliesItems,
} from "@/common-i18n";
import { createCredential2 } from "@/common-ids";
import { init_user } from "@/user-login";
import { WxGzhSender } from "@/service-send";
import { enter_ai } from "@/ai-entrance";

const db = cloud.database()
let wechat_access_token = ""

/***************************** constants **************************/

// 1 MB
const MB = 1024 * 1024
// how many accounts can be bound to one wechat gzh openid
const MAX_ACCOUNTS_TO_BIND = 2
// download temp media from wx gzh
const API_MEDIA_DOWNLOAD = "https://api.weixin.qq.com/cgi-bin/media/get"

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

  console.log("msgObj: ")
  console.log(msgObj)

  const { MsgType, FromUserName } = msgObj
  if(!FromUserName) {
    console.warn("no wx_gzh_openid!")
    return ""
  }

  if(MsgType === "text") {
    handle_text(msgObj)
  }
  else if(MsgType === "image") {
    handle_image(msgObj)
  }
  else if(MsgType === "voice") {
    handle_voice(msgObj)
  }
  else if(MsgType === "video") {
    handle_video(msgObj)
  }
  else if(MsgType === "location") {
    handle_location(msgObj)
  }
  else if(MsgType === "link") {
    handle_link(msgObj)
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
    else if(Event === "CLICK") {
      handle_click(msgObj)
    }
  }
  
  // respond with empty string, and then wechat will not retry
  return ""
}

async function handle_click(
  msgObj: Wx_Gzh_Click,
) {

  // 1. get params
  const { EventKey, FromUserName: wx_gzh_openid } = msgObj
  if(!EventKey) return false

  // 2. get replies and the domain
  const replies = wxClickReplies[EventKey]
  if(!replies || replies.length < 1) return false
  
  // 3. reply
  for(let i = 0; i < replies.length; i++) {
    const v = replies[i]
    const obj = valTool.copyObject(v)
    if(obj.msgtype === "text") {
      const str = obj.text.content 
      obj.text.content = i18nFill(str, {})
    }
    await sendObject(wx_gzh_openid, obj)
  }

  return true
}

async function handle_text(
  msgObj: Wx_Gzh_Text,
) {
  // 1. get openid
  const wx_gzh_openid = msgObj.FromUserName

  // 2. check if we get to auto-reply
  const userText = msgObj.Content
  const res2 = await autoReplyAfterReceivingText(wx_gzh_openid, userText)
  if(res2) return

  // 2.1 TODO: temporarily check out test openid
  const _env = process.env
  const testOpenId = _env.LIU_WX_GZ_TEST_OPENID
  if(!testOpenId || testOpenId !== wx_gzh_openid) {
    console.warn("interrupt handle_text!")
    return
  }

  // 3. get user
  const user = await getUserByWxGzhOpenid(wx_gzh_openid)
  if(!user) return

  // 4. ai!
  enter_ai({ user, msg_type: "text", text: userText, wx_gzh_openid })
}

async function handle_image(
  msgObj: Wx_Gzh_Image,
) {
  // 1. get params
  const wx_gzh_openid = msgObj.FromUserName
  const wx_media_id = msgObj.MediaId
  const image_url = msgObj.PicUrl

  // 2.1 TODO: temporarily check out test openid
  const _env = process.env
  const testOpenId = _env.LIU_WX_GZ_TEST_OPENID
  if(!testOpenId || testOpenId !== wx_gzh_openid) {
    console.warn("interrupt handle_image!")
    return
  }

  // 3. get user
  const user = await getUserByWxGzhOpenid(wx_gzh_openid)
  if(!user) return

  // 4. get to ai system
  enter_ai({ 
    user, 
    msg_type: "image", 
    image_url, 
    wx_media_id, 
    wx_gzh_openid,
  })
}

async function handle_voice(
  msgObj: Wx_Gzh_Voice,
) {
  // 1. get params
  const wx_gzh_openid = msgObj.FromUserName
  const wx_media_id = msgObj.MediaId
  const wx_media_id_16k = msgObj.MediaId16K

  // 2. send unsupported message
  const msg = _getUnsupportedMsg("voice_unsupported")
  sendText(wx_gzh_openid, msg)

  // // 2.1 TODO: temporarily check out test openid
  // const _env = process.env
  // const testOpenId = _env.LIU_WX_GZ_TEST_OPENID
  // if(!testOpenId || testOpenId !== wx_gzh_openid) {
  //   console.warn("interrupt handle_image!")
  //   return
  // }

  // // 3. get user
  // const user = await getUserByWxGzhOpenid(wx_gzh_openid)
  // if(!user) return

  // // 4. download voice
  // const res4 = await downloadVoice(wx_media_id)
  // if(!res4) return
  // const size4 = res4.fileBlob.size
  // const type4 = res4.fileBlob.type

  // console.log("size4: ", size4)
  // console.log("type4: ", type4)

  // if(size4 > MB) {
  //   console.warn("the audio is too large!")
  //   console.log(size4)
  //   return
  // }
  
  // // 5. get to ai system
  // enter_ai({ 
  //   user, 
  //   msg_type: "voice", 
  //   file_type: type4,
  //   file_base64: res4.b64,
  //   file_blob: res4.fileBlob,
  //   wx_media_id, 
  //   wx_media_id_16k,
  //   wx_gzh_openid,
  // })
}

async function handle_video(
  msgObj: Wx_Gzh_Video,
) {
  // 1. get openid
  const wx_gzh_openid = msgObj.FromUserName

  // 2. send unsupported message
  const msg = _getUnsupportedMsg("video_unsupported")
  sendText(wx_gzh_openid, msg)
}

async function  handle_location(
  msgObj: Wx_Gzh_Location,
) {
  // 1. get openid
  const wx_gzh_openid = msgObj.FromUserName

  // 2. send unsupported message
  const msg = _getUnsupportedMsg("location_unsupported")
  sendText(wx_gzh_openid, msg)
}

async function handle_link(
  msgObj: Wx_Gzh_Link,
) {
  // 1. get openid
  const wx_gzh_openid = msgObj.FromUserName

  // 2. send unsupported message
  const msg = _getUnsupportedMsg("link_unsupported")
  sendText(wx_gzh_openid, msg)
}


function _getUnsupportedMsg(key: string) {
  const { t } = useI18n(wechatLang)
  let msg = t(key)
  const { LIU_CUSTOMER_SERVICE } = process.env
  if(LIU_CUSTOMER_SERVICE) {
    msg += t("buy_time", { LIU_CUSTOMER_SERVICE })
  }
  return msg
}

async function handle_unsubscribe(
  msgObj: Wx_Gzh_Unsubscribe,
) {
  const wx_gzh_openid = msgObj.FromUserName

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

  // 3. get user info
  const userInfo = await getWxGzhUserInfo(wx_gzh_openid)

  // 4. get EventKey, and extract state
  const res4 = getDirectionCredential(msgObj.EventKey, "qrscene_")
  if(!res4) {
    send_welcome(wx_gzh_openid, userInfo)
    make_user_subscribed(wx_gzh_openid, userInfo)
    return
  }
  const { direction, credential } = res4

  // 5. decide which path to take
  const opt5 = { isFromSubscribeEvent: true }
  if(direction === "b2") {
    // get to bind account
    bind_wechat_gzh(wx_gzh_openid, credential, userInfo, opt5)
  }
  else if(direction === "b3") {
    // continue with wechat gzh
    login_with_wechat_gzh(wx_gzh_openid, credential, userInfo, opt5)
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

  // 3. get user info
  const userInfo = await getWxGzhUserInfo(wx_gzh_openid)

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

interface OperationOpt {
  isFromSubscribeEvent?: boolean
}

async function login_with_wechat_gzh(
  wx_gzh_openid: string,
  credential: string,
  userInfo?: Wx_Res_GzhUserInfo,
  opt?: OperationOpt,
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

  // 1.1 optionally send welcome_message
  if(opt?.isFromSubscribeEvent) {
    send_welcome(wx_gzh_openid, userInfo, meta_data.x_liu_language)
  }

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

  // 5. update user's tag (language) for wx gzh
  const data5 = res4.data
  if(data5) {
    const tmpUserInfo = data5[0]
    const user5 = tmpUserInfo?.user
    if(user5) {
      tagWxUserLang(wx_gzh_openid, user5, userInfo)
    }
  }

  // 6. set credential_2
  _setCredential2()
}


async function bind_wechat_gzh(
  wx_gzh_openid: string,
  credential: string,
  userInfo?: Wx_Res_GzhUserInfo,
  opt?: OperationOpt,
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
  const meta_data = data1.meta_data ?? {}
  const memberId_1 = meta_data?.memberId

  // 1.1 optionally send welcome_message
  if(opt?.isFromSubscribeEvent) {
    send_welcome(wx_gzh_openid, userInfo, meta_data.x_liu_language)
  }

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
    sendText(wx_gzh_openid, success_msg)
    await make_user_subscribed(wx_gzh_openid, userInfo, user3)
    if(memberId_1) {
      await _openWeChatNotification(memberId_1)
    }
    await _clearCredential(data1._id)
    await tagWxUserLang(wx_gzh_openid, user3, userInfo)
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
    sendText(wx_gzh_openid, already_bound_msg)
    return false
  }

  // 7. everything is ok
  await _success()

  return true
}

async function send_welcome(
  wx_gzh_openid: string,
  userInfo?: Wx_Res_GzhUserInfo,
  x_liu_language?: string,
) {
  // 1. get language
  const lang = x_liu_language ?? userInfo?.language

  // 2. i18n
  const { t } = useI18n(wechatLang, { lang })
  const text = t("welcome_2")
  
  // 3. reply user with text
  await sendText(wx_gzh_openid, text)

  return true
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

async function downloadVoice(
  media_id: string,
) {
  // 1. get accessToken for wx gzh
  const res1 = await checkAccessToken()
  if(!res1) return

  // 2. construct link
  const url = new URL(API_MEDIA_DOWNLOAD)
  const sP = url.searchParams
  sP.set("access_token", res1)
  sP.set("media_id", media_id)
  const link = url.toString()

  // 3. to download
  try {
    const res = await fetch(link)
    const fileBlob = await res.blob()
    const arrayBuffer = await fileBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const b64 = buffer.toString("base64")
    return { fileBlob, b64 }
  }
  catch(err) {
    console.warn("downloadVoice err:")
    console.log(err)
  }
}

// TODO WIP!
async function convertAMRtoMP3(

) {
  
}


// when user sends text, check out if we have to reply automatically
async function autoReplyAfterReceivingText(
  wx_gzh_openid: string,
  text: string,
) {
  // 1. check if text is empty
  const text1 = text.trim()
  if(!text1) {
    console.warn("autoReply: text is empty")
    return true
  }

  // 2. check if text is "[收到不支持的消息类型，暂无法显示]"
  if(text1.startsWith("[收到不支持的消息类型")) {
    await sendText(wx_gzh_openid, "[收到不支持的消息类型]")
    return true
  }

  // 3. TODO: because we're in beta, check if it is email address
  const res3 = isEmailAndNormalize(text1)
  if(res3) {
    return true
  }

  // 4. check out if auto reply
  let theReplies: Wx_Gzh_Send_Msg[] = []
  for(let i=0; i<wxTextRepliesItems.length; i++) {
    const item = wxTextRepliesItems[i]
    const { keywords, replies } = item
    const existed = keywords.includes(text1)
    if(existed) {
      theReplies = replies
      break
    }
  }
  if(theReplies.length < 1) return false
  
  // 5. auto reply
  for(let i = 0; i < theReplies.length; i++) {
    const v = theReplies[i]
    await sendObject(wx_gzh_openid, v)
  }
  return true
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

// take care of this function
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
  if(xml.msgid) {
    const msgid = xml.msgid[0]
    if(msgObj.Event === "MASSSENDJOBFINISH") {
      msgObj.MsgID = msgid
    }
    else {
      msgObj.MsgId = msgid
    }
  }
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

  // message job finish 群发结果回调
  if(xml.totalcount) msgObj.TotalCount = xml.totalcount[0]
  if(xml.filtercount) msgObj.FilterCount = xml.filtercount[0]
  if(xml.sentcount) msgObj.SentCount = xml.sentcount[0]
  if(xml.errorcount) msgObj.ErrorCount = xml.errorcount[0]

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

async function getUserByWxGzhOpenid(wx_gzh_openid: string) {
  const w3: Partial<Table_User> = {
    oState: "NORMAL",
    wx_gzh_openid,
  }
  const uCol = db.collection("User")
  const q3 = uCol.where(w3).orderBy("insertedStamp", "desc")
  const res3 = await q3.getOne<Table_User>()

  // check out login or not
  const user4 = res3.data
  if(!user4 || user4.oState !== "NORMAL") {
    const { t: t4 } = useI18n(wechatLang)
    const text4 = t4("login_first")
    await sendText(wx_gzh_openid, text4)
    return
  }

  return user4
}

async function sendText(
  wx_gzh_openid: string,
  text: string,
) {
  const res1 = await checkAccessToken()
  if(!res1) return false
  await WxGzhSender.sendTextMessage(wx_gzh_openid, wechat_access_token, text)
}

async function sendObject(
  wx_gzh_openid: string,
  obj: Wx_Gzh_Send_Msg,
) {
  const res1 = await checkAccessToken()
  if(!res1) return false
  await WxGzhSender.sendMessage(wx_gzh_openid, wechat_access_token, obj)
}

function getMsgMode(
  q: Record<string, any>,
  b: Record<string, any>,
): MsgMode {
  const encrypt_type = q.encrypt_type
  const encrypt = b?.xml?.encrypt

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