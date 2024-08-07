// Function Name: webhook-wecom
// Receive messages and events from WeCom
import cloud from "@lafjs/cloud";
import type { 
  LiuRqReturn,
  LiuErrReturn,
  Table_Config,
  Table_Credential,
  Table_User,
  Ww_Res_User_Info,
  Ww_Add_External_Contact,
  Ww_Msg_Event,
  Ww_Welcome_Body,
  Ww_Del_Follow_User,
  Table_Member,
} from "@/common-types";
import { decrypt, getSignature } from "@wecom/crypto";
import xml2js from "xml2js";
import { generateAvatar, getIp, liuReq, updateUserInCache } from "@/common-util";
import { useI18n, wecomLang } from "@/common-i18n";
import { getNowStamp } from "@/common-time";

const db = cloud.database()
const _ = db.command

let wecom_access_token = ""

/********* some constants *************/
const API_WECOM_SEND_WELCOME = "https://qyapi.weixin.qq.com/cgi-bin/externalcontact/send_welcome_msg"
const API_WECOM_GET_USERINFO = "https://qyapi.weixin.qq.com/cgi-bin/externalcontact/get"

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
      handle_add_external_contact(msgObj)
    }
    else if(ChangeType === "del_follow_user") {
      handle_del_follow_user(msgObj)
    }
    else if(ChangeType === "msg_audit_approved") {

    }
    
  }


  // respond with empty string, and then wecom will not retry
  return ""
}

async function handle_del_follow_user(
  msgObj: Ww_Del_Follow_User,
) {
  const { ExternalUserID } = msgObj
  
  // 1. look for ww_qynb_external_userid from db
  const uCol = db.collection("User")
  const q1 = uCol.where({ ww_qynb_external_userid: ExternalUserID })
  const res1 = await q1.getOne<Table_User>()

  const user = res1.data
  if(!user) {
    console.warn("no user in handle_del_follow_user")
    console.log(res1)
    return { code: "0000" }
  }

  // 2. construct query
  const now = getNowStamp()
  const w2: Record<string, any> = {
    ww_qynb_external_userid: _.remove(),
    updatedStamp: now,
  }
  delete user.ww_qynb_external_userid
  user.updatedStamp = now
  const thirdData = user.thirdData
  if(thirdData) {
    delete thirdData.wecom
    w2.thirdData = _.set(thirdData)
    user.thirdData = thirdData
  }

  // 3. update user
  const res3 = await uCol.doc(user._id).update(w2)
  updateUserInCache(user._id, user)

  return { code: "0000" }
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

  // 0.4 when usually
  const _when_usually = async (
    account: string,
    user: Table_User,
  ) => {
    if(!WelcomeCode) return
    const { t: t1 } = useI18n(wecomLang, { user })
    const content = t1("welcome_1", { account })
    await sendWelcomeMessage({
      welcome_code: WelcomeCode,
      text: { content },
    })
  }


  // 1. if ExternalUserID is empty, return
  if(!ExternalUserID) {
    console.warn("fails to get ExternalUserID")
    console.log(msgObj)
    return { code: "E5002", errMsg: "ExternalUserID is empty" }
  }

  // 1.2 get user info from wecom
  const res1_2 = await getExternalContactOfWecom(ExternalUserID)
  if(res1_2.code !== "0000" || !res1_2.data) {
    console.warn("fail to get user info")
    console.log(res1_2)
    return res1_2
  }
  const userInfo = res1_2.data.external_contact
  const follow_user = res1_2.data.follow_user
  console.log("userInfo from wecom: ")
  console.log(userInfo)
  console.log("follow_user from wecom: ")
  console.log(follow_user)

  // 1.3 check if ExternalUserID has been bound
  const uCol = db.collection("User")
  const w1_3: Partial<Table_User> = {
    ww_qynb_external_userid: ExternalUserID,
  }
  const res1_3 = await uCol.where(w1_3).get<Table_User>()
  const list1_3 = res1_3.data
  if(list1_3.length > 0) {
    console.warn("ExternalUserID has been bound")
    console.log(list1_3)
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

  // 7. get userId for our app
  const userId = c5.userId
  const memberId = c5.meta_data?.memberId
  if(!userId) {
    console.warn("userId in credential is empty")
    return { code: "E5001", errMsg: "userId is empty" }
  }

  // 8. get user from our db
  const res8 = await uCol.doc(userId).get<Table_User>()
  const user = res8.data
  if(!user) {
    console.warn("there is no user")
    return { code: "E5001", errMsg: "there is no user" }
  }
  
  // 9. get member
  let member: Table_Member | null
  const mCol = db.collection("Member")
  if(memberId) {
    const res9_1 = await mCol.doc(memberId).get<Table_Member>()
    member = res9_1.data
  }
  else {
    const w9: Partial<Table_Member> = {
      spaceType: "ME",
      user: userId,
    }
    const res9_2 = await mCol.where(w9).getOne<Table_Member>()
    member = res9_2.data
  }
  
  // 10. no member
  if(!member) {
    console.warn("no member in handle_add_external_contact")
    console.log("user: ", user)
    console.log("msgObj: ", msgObj)
    return { code: "E5001", errMsg: "no member" }
  }

  // 11. get account & send welcome
  let name11 = member.name
  if(!name11) {
    name11 = userInfo.name
  }
  _when_usually(name11, user)

  // 12. update user
  user.ww_qynb_external_userid = ExternalUserID
  user.updatedStamp = now
  const thirdData = { ...user.thirdData }
  thirdData.wecom = userInfo
  const w9: Partial<Table_User> = {
    ww_qynb_external_userid: ExternalUserID,
    updatedStamp: now,
    thirdData,
  }
  const res9 = await uCol.doc(userId).update(w9)
  updateUserInCache(userId, user)


  // 13. check if updating member is needed
  let updateMember = false
  const w13: Partial<Table_Member> = {
    updatedStamp: getNowStamp(),
  }
  if(!member.name) {
    updateMember = true
    w13.name = userInfo.name
  }
  if(!member.avatar && userInfo.avatar) {
    updateMember = true
    w13.avatar = generateAvatar(userInfo.avatar)
  }
  if(memberId) {
    updateMember = true
    const noti13 = { ...member.notification }
    noti13.ww_qynb_remind = true
    w13.notification = noti13
  }

  // 14. update member
  if(updateMember) {
    const res14 = await mCol.doc(member._id).update(w13)
  }

  // 15. make cred expired
  const now15 = getNowStamp()
  const w15: Partial<Table_Credential> = {
    expireStamp: now15,
    updatedStamp: now15,
  }
  const res10 = await cCol.doc(c5_id).update(w15)

  // n. reset
  reset()

  return { code: "0000" }
}


async function getExternalContactOfWecom(
  external_userid: string,
): Promise<LiuRqReturn<Ww_Res_User_Info>> {
  // 1. get access_token
  const res1 = await checkWecomAccessToken()
  if(!res1.pass) return res1.err

  // 2. package request URL
  const url = new URL(API_WECOM_GET_USERINFO)
  const sP = url.searchParams
  sP.set("access_token", wecom_access_token)
  sP.set("external_userid", external_userid)
  const link = url.toString()

  // 3. fetch
  const res3 = await liuReq<Ww_Res_User_Info>(link, undefined, { method: "GET" })

  console.log("getExternalContactOfWecom res3: ")
  console.log(res3)

  return res3
}



async function sendWelcomeMessage(
  data: Ww_Welcome_Body,
): Promise<LiuRqReturn> {
  // 1. check access_token
  const res1 = await checkWecomAccessToken()
  if(!res1.pass) return res1.err

  // 2. package url and body
  const url = new URL(API_WECOM_SEND_WELCOME)
  url.searchParams.set("access_token", wecom_access_token)
  const link = url.toString()
  const res2 = await liuReq(link, data)

  console.log("sendWelcomeMessage res2: ")
  console.log(res2)

  return { code: "0000" }
}


function reset() {
  wecom_access_token = ""
}


async function getWecomAccessToken() {
  const col = db.collection("Config")
  const res = await col.get<Table_Config>()
  const list = res.data
  let cfg = list[0]
  if(!cfg) return
  const access_token = cfg.wecom_qynb?.access_token
  wecom_access_token = access_token ?? ""
  return access_token
}


interface Cwat_A {
  pass: true
}

interface Cwat_B {
  pass: false
  err: LiuErrReturn
}

type CwatRes = Cwat_A | Cwat_B

async function checkWecomAccessToken(): Promise<CwatRes> {
  if(wecom_access_token) {
    return { pass: true }
  }
  const access_token = await getWecomAccessToken()
  if(!access_token) {
    return { 
      pass: false, 
      err: { code: "E5001", errMsg: "wecom access_token is empty" },
    }
  }
  return { pass: true }
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
