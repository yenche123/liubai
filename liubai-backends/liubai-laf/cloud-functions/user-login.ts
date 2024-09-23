// Function Name: user-login

// 用户登录、注册、进入
import cloud from '@lafjs/cloud'
import type { 
  PartialSth,
  LiuRqReturn, 
  SupportedTheme,
  Shared_LoginState, 
  Table_User, 
  Table_Member,
  UserThirdData, 
  Table_Workspace,
  LiuUserInfo,
  Table_Token,
  Table_Credential,
  Res_ULN_User,
  Res_UserLoginNormal,
  LiuSpaceAndMember,
  SupportedClient,
  LiuResendEmailsParam,
  Table_AllowList,
  UserLoginOperate,
  LiuErrReturn,
  Wx_Res_GzhSnsUserInfo,
  UserWeChatGzh,
  Wx_Res_GzhUserInfo,
  MemberNotification,
  Wx_Res_Create_QR,
  Res_UL_WxGzhScan,
  Res_UL_ScanCheck,
  Table_Credential_Type,
  Res_UL_WxGzhBase,
  LiuTencentSESParam,
  LiuSESChannel,
} from "@/common-types"
import { clientMaximum } from "@/common-types"
import { 
  decryptWithRSA, 
  getPublicKey, 
  isEmailAndNormalize, 
  getDocAddId,
  generateAvatar,
  canPassByExponentialDoor,
  normalizeToLocalTheme,
  normalizeToLocalLocale,
  getUserInfos,
  insertToken,
  liuReq,
  checkAndGetWxGzhAccessToken,
  normalizeUserAgent,
  displayTime,
  getIp,
  getIpGeo,
  tagWxUserLang,
  getWxGzhUserInfo,
  getWxGzhUserOAuthAccessToken,
  valTool,
} from "@/common-util"
import { getNowStamp, MINUTE, getBasicStampWhileAdding } from "@/common-time"
import { 
  createCredentialForUserSelect, 
  createLoginState,
  createOpenId,
  createSignInCredential,
} from "@/common-ids"
import { 
  checkIfEmailSentTooMuch, 
  getActiveEmailCode,
  LiuResend,
  LiuTencentSES,
  sendWxTextMessage,
} from "@/service-send"
import { 
  userLoginLang, 
  useI18n, 
  getAppName, 
  getCurrentLocale, 
  type GetLangValOpt,
} from '@/common-i18n'
import { OAuth2Client, type TokenPayload } from "google-auth-library"
import { downloadAndUpload } from '@/file-utils'
import { tencent_ses_tmpl_cfg } from "@/common-config"

/************************ 一些常量 *************************/
// GitHub 使用 code 去换 accessToken
const GH_OAUTH_ACCESS_TOKEN = "https://github.com/login/oauth/access_token"

// GitHub 使用 accessToken 去获取用户信息
const GH_API_USER = "https://api.github.com/user"

// Google 使用 code 去换 accessToken
const GOOGLE_OAUTH_ACCESS_TOKEN = "https://oauth2.googleapis.com/token"

// Google 使用 accessToken 去获取用户信息
const GOOGLE_API_USER = "https://www.googleapis.com/oauth2/v3/userinfo"

// 微信公众号 OAuth2 使用 accessToken 去获取用户信息
const WX_GZH_SNS_USERINFO = "https://api.weixin.qq.com/sns/userinfo"

// 微信公众号 创建二维码
const API_WECHAT_CREATE_QRCODE = "https://api.weixin.qq.com/cgi-bin/qrcode/create"

const PREFIX_CLIENT_KEY = "client_key_"

const MIN_5 = 5 * MINUTE

const TEST_EMAILS = [
  "delivered@resend.dev",
  "bounced@resend.dev",
  "complained@resend.dev"
]

const db = cloud.database()
const _ = db.command


/************************ 函数们 *************************/

export async function main(ctx: FunctionContext) {

  // 0.1 检查 "登录功能" 是否关闭
  const env = process.env
  if(env.LIU_CLOUD_LOGIN === "02") {
    ctx.response?.send({ code: "B0002" })
    return false
  }

  const body = ctx.request?.body ?? {}
  const oT = body.operateType as UserLoginOperate

  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "init") {
    res = handle_init()
  }
  else if(oT === "github_oauth") {
    res = await handle_github_oauth(ctx, body)
  }
  else if(oT === "google_oauth") {
    res = await handle_google_oauth(ctx, body)
  }
  else if(oT === "wx_gzh_oauth") {
    res = await handle_wx_gzh_oauth(ctx, body)
  }
  else if(oT === "wx_gzh_base") {
    res = await handle_wx_gzh_base(ctx, body)
  }
  else if(oT === "email") {
    res = await handle_email(ctx, body)
  }
  else if(oT === "email_code") {
    res = await handle_email_code(ctx, body)
  }
  else if(oT === "google_credential") {
    res = await handle_google_one_tap(ctx, body)
  }
  else if(oT === "users_select") {
    res = await handle_users_select(ctx, body)
  }
  else if(oT === "wx_gzh_scan") {
    res = await handle_wx_gzh_scan(ctx, body)
  }
  else if(oT === "scan_check") {
    res = await handle_scan_check(ctx, body)
  }
  else if(oT === "scan_login") {
    res = await handle_scan_login(ctx, body)
  }

  return res
}


/***************************** Sign in with credential_2 *************************/
async function handle_scan_login(
  ctx: FunctionContext,
  body: Record<string, string>,
) {
  // 1. check out params
  const cred = body.credential
  const cred_2 = body.credential_2
  if(!cred || typeof cred !== "string") {
    return { code: "E4000", errMsg: "no credential" }
  }
  if(!cred_2 || typeof cred_2 !== "string") {
    return { code: "E4000", errMsg: "no credential_2" }
  }

  // 2. check out client_key
  const { client_key, code: code1, errMsg: errMsg1 } = getClientKey(body.enc_client_key)
  if(!client_key || code1) {
    return { code: code1 ?? "E5001", errMsg: errMsg1 }
  }

  // 3. get cred
  const cCol = db.collection("Credential")
  const q3 = cCol.where({ credential: cred })
  const res3 = await q3.orderBy("insertedStamp", "desc").get<Table_Credential>()
  const list3 = res3.data
  const fir3 = list3[0]
  if(!fir3) {
    return { code: "E4003", errMsg: "no credential" }
  }

  // 4. check if credential_2 is matched
  if(fir3.credential_2 !== cred_2) {
    return { code: "E4003", errMsg: "credential_2 is not matched" }
  }
  
  // 5. decide which path to log in
  const infoType = fir3.infoType
  const wx_gzh_openid = fir3.meta_data?.wx_gzh_openid

  // 6. define remove credential function
  const _removeCredential = () => {
    cCol.where({ _id: fir3._id }).remove()
  }

  // 7.1 login with wx_gzh_openid
  if(infoType === "wx-gzh-scan" && wx_gzh_openid) {
    const opt7_1 = { client_key }
    const res7_1 = await tryToSignInWithWxGzhOpenId(ctx, body, wx_gzh_openid, opt7_1)
    
    if(res7_1) {
      // 7.2 TODO: send message to user: login successfully
      const lang = res7_1.data?.language
      sendLoginMsgToWxGzhUser(ctx, wx_gzh_openid, "wx-gzh-scan", { body, lang })
      _removeCredential()
      return res7_1
    }

    return { code: "E4003", errMsg: "sign in with wx_gzh_openid failed" }
  }

  return { code: "E4003", errMsg: "no way to log in" }
}

/****************************** Detect qr code *************************/
async function handle_scan_check(
  ctx: FunctionContext,
  body: Record<string, string>,
): Promise<LiuRqReturn<Res_UL_ScanCheck>> {
  const cred = body.credential
  if(!cred || typeof cred !== "string") {
    return { code: "E4000", errMsg: "no credential" }
  }

  // 1. get credential
  const cCol = db.collection("Credential")
  const q1 = cCol.where({ credential: cred })
  const res1 = await q1.orderBy("insertedStamp", "desc").get<Table_Credential>()
  const list1 = res1.data
  const fir1 = list1[0]
  if(!fir1) {
    return { code: "E4004", errMsg: "no credential" }
  }

  const resData: Res_UL_ScanCheck = {
    operateType: "scan_check",
    status: "waiting",
  }

  // 2. check if it is available
  const now2 = getNowStamp()
  const { expireStamp, verifyNum, infoType } = fir1
  const info_types: Table_Credential_Type[] = ["wx-gzh-scan"]
  if(!info_types.includes(infoType)) {
    return { code: "E4003", errMsg: "infoType is not supported" }
  }
  if(now2 > expireStamp) {
    resData.status = "expired"
    return { code: "0000", data: resData }
  }
  if(verifyNum && verifyNum > 100) {
    return { code: "E4003", errMsg: "checking too much" }
  }

  // 3. check if credential_2 exists
  const credential_2 = fir1.credential_2
  if(credential_2) {
    resData.status = "plz_check"
    resData.credential_2 = credential_2
    return { code: "0000", data: resData }
  }

  // 4. add verifyNum
  const newVerifyNum = verifyNum ? verifyNum + 1 : 1
  addVerifyNum(fir1._id, newVerifyNum)
  
  return { code: "0000", data: resData }
}


/**************************** request wechat qr code *************************/
async function handle_wx_gzh_scan(
  ctx: FunctionContext,
  body: Record<string, string>,
): Promise<LiuRqReturn<Res_UL_WxGzhScan>> {
  // 1. to check state
  const state = body.state
  const res1 = checkIfStateIsErr(state)
  if(res1) return res1

  // 2. get wx gzh access_token
  const wx_access_token = await checkAndGetWxGzhAccessToken()
  if(!wx_access_token) {
    return { code: "E5001", errMsg: "wechat accessToken not found" }
  }

  // 3. generate credential
  const cred = createSignInCredential()
  const scene_str = `b3=${cred}`
  const w3 = {
    expire_seconds: 60 * 6,
    action_name: "QR_STR_SCENE",
    action_info: {
      scene: {
        scene_str,
      }
    }
  }
  const url3 = new URL(API_WECHAT_CREATE_QRCODE)
  url3.searchParams.set("access_token", wx_access_token)
  const link3 = url3.toString()
  const res3 = await liuReq<Wx_Res_Create_QR>(link3, w3)

  // 4. extract data from wechat
  const res4 = res3.data
  const qr_code_4 = res4?.url
  if(!qr_code_4) {
    return { 
      code: "E5004", 
      errMsg: "creating QR code from wechat failed",
    }
  }

  // 5. add credential into db
  const b5 = getBasicStampWhileAdding()
  const now5 = b5.insertedStamp
  const data5: Partial<Table_Credential> = {
    ...b5,
    credential: cred,
    infoType: "wx-gzh-scan",
    expireStamp: now5 + MIN_5,
    verifyNum: 0,
    meta_data: {
      qr_code: qr_code_4,
      x_liu_theme: body["x_liu_theme"],
      x_liu_language: body["x_liu_language"],
    }
  }
  const cCol = db.collection("Credential")
  cCol.add(data5)

  return {
    code: "0000",
    data: {
      operateType: "wx_gzh_scan",
      qr_code: qr_code_4,
      credential: cred,
    }
  }
}


/******************************** 选定某个账号登录 *************************/
async function handle_users_select(
  ctx: FunctionContext,
  body: Record<string, string>,
): Promise<LiuRqReturn> {

  // 1. getting some params
  const userId = body.userId
  const m1 = body.multi_credential
  const m2 = body.multi_credential_id
  if(!userId || !m1 || !m2) {
    return { 
      code: "E4000", 
      errMsg: "userId, multi_credential and multi_credential_id are required", 
    }
  }

  // 2. to check state
  const state = body.state
  const res0 = checkIfStateIsErr(state)
  if(res0) return res0

  // 3. to check client_key
  const { client_key, code: code1, errMsg: errMsg1 } = getClientKey(body.enc_client_key)
  if(!client_key || code1) {
    return { code: code1 ?? "E5001", errMsg: errMsg1 }
  }

  // 4. to get credential
  const errReturnData = {
    code: "E4003",
    errMsg: "the credential is wrong"
  }
  const col = db.collection("Credential")
  const res1 = await col.doc(m2).get<Table_Credential>()
  const c = res1.data

  // 5. to check if the credential is existed
  if(!c) {
    console.warn("the credential is not existed")
    return errReturnData
  }

  // 6. to check if the credential is matched
  if(c.credential !== m1) {
    console.warn("the credential is not matched")
    return errReturnData
  }

  // 7. to check infoType
  if(c.infoType !== "users-select") {
    console.warn("infoType of c is not users-select")
    return errReturnData
  }

  // 8. to check userId
  const user_ids = c.user_ids ?? []
  const inIt = user_ids.includes(userId)
  if(!inIt) {
    console.warn("the userId is not matched")
    return errReturnData
  }

  // 9. to check expireStamp
  const now = getNowStamp()
  if(now > c.expireStamp) {
    console.warn("credential has been expired")
    return errReturnData
  }

  // 10. to login
  const res2 = await findUserById(userId)

  // 拒绝登录、或异常
  if(res2.type === 1) {
    return res2.rqReturn
  }

  // 去登录
  if(res2.type === 2) {
    const opt1 = {
      client_key, thirdData: c.thirdData
    }
    const res3 = await sign_in(ctx, body, res2.userInfos, opt1)

    // to delete credential
    col.where({ _id: c._id }).remove()

    return res3
  }

  return { 
    code: "E5001", 
    errMsg: "it is impossible to sign up because userId is given",
  }
}

/******************************** 用 google one-tap 登录 *************************/
async function handle_google_one_tap(
  ctx: FunctionContext,
  body: Record<string, string>,
) {

  // 1. to check google_id_token
  const google_id_token = body.google_id_token
  if(!google_id_token) {
    return { code: "E4000", errMsg: "no google_id_token" }
  }

  // 2. to check state
  const state = body.state
  const res0 = checkIfStateIsErr(state)
  if(res0) return res0

  // 3. to check client_key
  const { client_key, code: code1, errMsg: errMsg1 } = getClientKey(body.enc_client_key)
  if(!client_key || code1) {
    return { code: code1 ?? "E5001", errMsg: errMsg1 }
  }

  // 4. to check LIU_GOOGLE_OAUTH_CLIENT_ID
  const _env = process.env
  const client_id = _env.LIU_GOOGLE_OAUTH_CLIENT_ID
  const client_secret = _env.LIU_GOOGLE_OAUTH_CLIENT_SECRET
  if(!client_id || !client_secret) {
    return { code: "E5001", errMsg: "no google's client_id or client_secret on backend" }
  }

  let googlePayload: TokenPayload | undefined
  const googleClient = new OAuth2Client()
  try {
    console.log("去验证 google idToken...........")
    const diff1 = getNowStamp()
    const ticket = await googleClient.verifyIdToken({
      idToken: google_id_token,
      audience: client_id,
    })
    const diff2 = getNowStamp()
    console.log(`验证时长: ${ diff2 - diff1 }ms`)
    googlePayload = ticket.getPayload()
  }
  catch(err) {
    console.warn("google verifyIdToken err: ")
    console.log(err)
    console.log(" ")
    return { code: "E4003", errMsg: "verifyIdToken failed" }
  }

  console.log("googlePayload: ")
  console.log(googlePayload)
  console.log(" ")

  if(!googlePayload) {
    return { code: "E4003", errMsg: "googlePayload is nothing" }
  }

  let { email: tmpEmail, email_verified } = googlePayload
  let email = isEmailAndNormalize(tmpEmail)
  if(!email) {
    return { code: "U0002" }
  }
  if(!email_verified) {
    const rData: Res_UserLoginNormal = { email }
    return { code: "U0001", data: rData }
  }
  
  const opt: UserThirdData = { google: googlePayload }
  const res3 = await signInUpViaEmail(ctx, body, email, client_key, opt)
  return res3
}



/******************************** 用 验证码+email 试图登录 *************************/
async function handle_email_code(
  ctx: FunctionContext,
  body: Record<string, string>,
) {

  // to check email
  let tmpEmail = body.email
  const enc_email = body.enc_email
  if(!tmpEmail && !enc_email) {
    return { code: "E4000", errMsg: "no email" }
  }
  
  // to decrypt email
  if(enc_email) {
    const { 
      plainText: dec_email,
      code: dec_code,
      errMsg: dec_errMsg,
    } = decryptWithRSA(enc_email)
    if(dec_code || !dec_email) {
      return { code: dec_code ?? "E5001", errMsg: dec_errMsg }
    }
    tmpEmail = dec_email
  }

  // to check email again
  const email = isEmailAndNormalize(tmpEmail)
  if(!email) {
    return { code: "E4000", errMsg: "the format of email is wrong" }
  }

  // to check email_code
  const email_code = body.email_code
  if(!email_code && email_code.length < 5) {
    return { code: "E4000", errMsg: "no email_code" }
  }

  // to check client_key
  const { client_key, code: code1, errMsg: errMsg1 } = getClientKey(body.enc_client_key)
  if(!client_key || code1) {
    return { code: code1 ?? "E5001", errMsg: errMsg1 }
  }

  const errReturnData = {
    code: "E4003",
    errMsg: "the email_code is wrong or expired, or checking is too much"
  }

  // 1. to check credential
  const w = { infoType: "email-code", email }
  const col = db.collection("Credential")
  const q = col.where(w)
  const res = await q.orderBy("insertedStamp", "desc").get<Table_Credential>()
  const list = res.data
  const firstCre = list[0]
  if(!firstCre) {
    console.log("查无任何 Credential")
    return errReturnData
  }

  // 2. to check verifyNum
  const { verifyNum, insertedStamp, credential, expireStamp } = firstCre
  const verifyData = canPassByExponentialDoor(insertedStamp, verifyNum)
  if(!verifyData.pass) {
    console.warn("checking credential too much")
    return errReturnData
  }

  // 3. to check credential
  if(email_code !== credential) {
    console.warn("the email_code is not equal to credential")
    await addVerifyNum(firstCre._id, verifyData.verifiedNum)
    return errReturnData
  }

  // 4. to check expireStamp
  const now1 = getNowStamp()
  if(now1 > expireStamp) {
    console.warn("credential has been expired")
    return errReturnData
  }

  // the following has been pass
  // 5. to remove credential
  col.where({ _id: firstCre._id }).remove()

  // 6. 去注册或登录
  const res3 = await signInUpViaEmail(ctx, body, email, client_key)
  return res3
}

/** 修改 Credential 的 verifyNum */
async function addVerifyNum(
  id: string,
  verifyNum: number,
) {
  const u1 = { 
    updatedStamp: getNowStamp(),
    verifyNum,
  }
  const col = db.collection("Credential")
  const res1 = await col.where({ _id: id }).update(u1)
}


/******************************** 向邮箱发送验证码 *************************/
async function handle_email(
  ctx: FunctionContext,
  body: Record<string, string>,
) {
  const T1 = getNowStamp()

  let tmpEmail = body.email
  const enc_email = body.enc_email
  if(!tmpEmail && !enc_email) {
    return { code: "E4000", errMsg: "no email" }
  }

  // 0. 解密 enc_email
  if(enc_email) {
    const { 
      plainText: dec_email,
      code: dec_code,
      errMsg: dec_errMsg,
    } = decryptWithRSA(enc_email)
    if(dec_code || !dec_email) {
      return { code: dec_code ?? "E5001", errMsg: dec_errMsg }
    }
    tmpEmail = dec_email
  }

  // 1. 检查 email
  const email = isEmailAndNormalize(tmpEmail)
  if(!email) {
    return { code: "E4000", errMsg: "the format of email is wrong" }
  }

  // 2. 检查 state
  const state = body.state
  const res0 = checkIfStateIsErr(state)
  if(res0) return res0

  console.log(`user wants to log in using ${email}`)

  // 2.1 检测邮箱是否在许可名单内
  const res0_1 = await checkAllowList("email", email)
  if(!res0_1) {
    return { code: "U0006", errMsg: "the email is not in allow-list" }
  }

  // 3. 检查 email 是否发送过于频繁
  const res1 = await checkIfEmailSentTooMuch(email)
  if(res1) return res1

  // 4. 获取有效的验证码
  const res2 = await getActiveEmailCode()
  const emailCode = res2.data?.code
  if(!emailCode || typeof emailCode !== "string") {
    return res2
  }

  // 5. 存入 email code 进 Table_Credential 中
  const basic1 = getBasicStampWhileAdding()
  const expireStamp = getNowStamp() + 16 * MINUTE
  const obj1: PartialSth<Table_Credential, "_id"> = {
    ...basic1,
    credential: emailCode,
    infoType: "email-code",
    expireStamp,
    email,
  }
  const res3 = await db.collection("Credential").add(obj1)
  const cId = getDocAddId(res3)
  if(!cId) {
    return { code: "E5001", errMsg: "cannot insert email-code into Credential" }
  }

  // 6. get appName, i18n, and some other data
  const appName = getAppName({ body })
  const { t } = useI18n(userLoginLang, { body })
  const subject = t('confirmation_subject')

  // 7. define some functions to send email
  const _sendByResend = async () => {
    let text = t('confirmation_text_1', { appName, code: emailCode })
    text += t('confirmation_text_2')
  
    // 7.1 send
    const dataSent: LiuResendEmailsParam = {
      to: [email],
      subject,
      text,
    }
    const res7 = await LiuResend.sendEmails(dataSent)
  
    // 7.2 handle result
    handleEmailSent(cId, "resend", res7)
  
    // 7.3 remove data if success
    if(res7.code === "0000") {
      delete res7.data
    }
    return res7
  }

  const _sendByTencentSES = async () => {
    const lang = getCurrentLocale({ body })
    const confirmation_tmpl = tencent_ses_tmpl_cfg.confirmation
    const TemplateID = confirmation_tmpl[lang]
    if(!TemplateID) {
      return { code: "E5001", errMsg: "no confirmation_tmpl_id" }
    }
    const templ_data = {
      appName,
      code: emailCode,
    }
    const TemplateData = valTool.objToStr(templ_data)

    console.log("TemplateID: ", TemplateID)
    console.log("templ_data: ")
    console.log(templ_data)

    const dataSent: LiuTencentSESParam = {
      to: [email],
      subject,
      Template: {
        TemplateID,
        TemplateData,
      }
    }
    const res7 = await LiuTencentSES.sendEmails(dataSent)

    // 8. handle result
    handleEmailSent(cId, "tencent-ses", res7)
  
    // 9. remove data if success
    if(res7.code === "0000") {
      delete res7.data
    }
    return res7
  }


  // 8. choose send channel
  const _env = process.env
  const sendChannel = _env.LIU_EMAIL_SEND_CHANNEL
  let res8: LiuRqReturn | undefined
  if(sendChannel === "tencent-ses") {
    res8 = await _sendByTencentSES()
  }
  else {
    res8 = await _sendByResend()
  }

  const T2 = getNowStamp()
  console.log("handle_email spent: ", T2 - T1)

  if(!res8) {
    return { code: "E5001", errMsg: "cannot send email" }
  }

  return res8
}


function handleEmailSent(
  cId: string,
  send_channel: LiuSESChannel,
  res: LiuRqReturn<Record<string, any>>,
) {
  const u: Partial<Table_Credential> = {}
  const { code, data } = res
  const now = getNowStamp()

  const q = db.collection("Credential").where({ _id: cId })

  u.send_channel = send_channel
  u.updatedStamp = now
  if(code === "0000") {
    if(valTool.isStringWithVal(data?.id)) {
      u.email_id = data.id
      q.update(u)
    }
    else if(valTool.isStringWithVal(data?.MessageId)) {
      u.email_id = data.id
      q.update(u)
    }
  }

  if(code === "U0005") {
    console.warn('邮件发送失败')
    console.log('删除该 Credential')
    q.remove()
  }
}



/******************************** Google OAuth 2.0 *************************/
async function handle_google_oauth(
  ctx: FunctionContext,
  body: Record<string, string>,
) {
  // 1. check out parameters
  const res1 = checkOAuthParams(body)
  const { code: code1, data: data1 } = res1
  if(code1 !== "0000" || !data1) {
    return res1 as LiuErrReturn
  }
  const { oauth_code, client_key } = data1

  // 2. check out redirect_uri
  const redirect_uri = body.oauth_redirect_uri
  if(!redirect_uri) {
    return { code: "E4000", errMsg: "no oauth_redirect_uri" }
  }

  // 3. get client_id & client_secret
  const _env = process.env
  const client_id = _env.LIU_GOOGLE_OAUTH_CLIENT_ID
  const client_secret = _env.LIU_GOOGLE_OAUTH_CLIENT_SECRET
  if(!client_id || !client_secret) {
    return { code: "E5001", errMsg: "no client_id or client_secret on backend" }
  }

  // 4. get access_token with code
  const body4 = {
    client_id,
    client_secret,
    code: oauth_code,
    redirect_uri,
    grant_type: "authorization_code",
  }
  let access_token = ""
  const res4 = await liuReq(GOOGLE_OAUTH_ACCESS_TOKEN, body4)

  // 5. 解析出 access_token
  const data5 = res4?.data ?? {}
  console.log("google oauth data5: ")
  console.log(data5)
  access_token = data5?.access_token
  if(!access_token) {
    console.warn("没有获得 google access_token")
    if(data5?.error === undefined) {
      console.log(res4)
    }
    return { code: "E5004", errMsg: "no access_token from Google" }
  }

  // 6. 使用 access_token 去换用户信息
  const res6 = await liuReq(GOOGLE_API_USER, undefined, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${access_token}`,
    }
  })

  // 7. 解析出有用的 user data from Google
  const data7 = res6?.data ?? {}
  console.log("google data7: ")
  console.log(data7)

  let { email, email_verified } = data7
  email = isEmailAndNormalize(email)
  if(!email) {
    return { code: "U0002" }
  }
  if(!email_verified) {
    const rData: Res_UserLoginNormal = { email }
    return { code: "U0001", data: rData }
  }

  // 8. find the user using email address
  const thirdData: UserThirdData = { google: data7 }
  const res8 = await signInUpViaEmail(ctx, body, email, client_key, thirdData)
  return res8
}

async function handle_wx_gzh_base(
  ctx: FunctionContext,
  body: Record<string, string>,
): Promise<LiuRqReturn<Res_UL_WxGzhBase>> {
  // 1. check out oauth_code
  const oauth_code = body.oauth_code
  if(!oauth_code) {
    return { code: "E4000", errMsg: "no oauth_code" }
  }

  // 2. check out state
  const state = body.state
  const res0 = checkIfStateIsErr(state)
  if(res0) return res0

  // 3. [ignore] this logic has been merged into 4.

  // 4. get access_token with code
  const res4 = await getWxGzhUserOAuthAccessToken(oauth_code)

  // 5. extract openid
  const data5 = res4?.data
  const openid = data5?.openid
  if(!openid) {
    console.warn("no openid from wx gzh")
    console.log(res4)
    return { code: "E5004", errMsg: "no openid from wx gzh" }
  }

  return { 
    code: "0000", 
    data: { 
      operateType: "wx_gzh_base",
      wx_gzh_openid: openid,
    }
  }
}

async function handle_wx_gzh_oauth(
  ctx: FunctionContext,
  body: Record<string, string>,
): Promise<LiuRqReturn<Res_UserLoginNormal>> {
  // 1. check out params
  const res1 = checkOAuthParams(body)
  const { code: code1, data: data1 } = res1
  if(code1 !== "0000" || !data1) {
    return res1 as LiuErrReturn
  }
  
  // 2. get oauth_code & client_key
  const { oauth_code, client_key } = data1

  // 3. get user's accessToken
  const res3 = await getWxGzhUserOAuthAccessToken(oauth_code)
  const code3 = res3?.code
  if(code3 !== "0000") {
    return res3 as LiuErrReturn
  }

  // 4. extract access_token, and so on
  const data4 = res3?.data
  const access_token = data4?.access_token
  if(!access_token) {
    console.warn("no access_token from wx gzh")
    console.log(res3)
    return { code: "E5004", errMsg: "no access_token from wx gzh" }
  }
  const wx_gzh_openid = data4?.openid
  if(!wx_gzh_openid) {
    console.warn("no openid from wx gzh")
    console.log(res3)
    return { code: "E5004", errMsg: "no openid from wx gzh" }
  }
  const is_snapshotuser = data4?.is_snapshotuser
  if(is_snapshotuser === 1) {
    console.warn("the user is a snapshot user")
    console.log(res3)
    return { code: "U0007", errMsg: "the user is a snapshot user" }
  }

  // 5. get user info
  const url5 = new URL(WX_GZH_SNS_USERINFO)
  const sp5 = url5.searchParams
  sp5.set("access_token", access_token)
  sp5.set("openid", wx_gzh_openid)
  sp5.set("lang", "en")
  const link5 = url5.toString()
  const res5 = await liuReq<Wx_Res_GzhSnsUserInfo>(link5, undefined, { method: "GET" })
  const data5 = res5?.data

  if(!data5?.nickname) {
    console.warn("no nickname from wx gzh")
    console.log(res5)
    return { code: "E5004", errMsg: "no nickname from wx gzh" }
  }

  // 6. create userWeChatGzh
  const wx_gzh: UserWeChatGzh = {
    nickname: data5.nickname,
    headimgurl: data5.headimgurl,
  }
  const thirdData: UserThirdData = { wx_gzh }

  // 7. try to sign in with wx_gzh_openid
  const opt7 = { client_key, thirdData }
  const res7 = await tryToSignInWithWxGzhOpenId(ctx, body, wx_gzh_openid, opt7)
  if(res7) return res7

  /******* prepare to sign up ********/
  
  // 8. get subscribe status of the user
  const wx_gzh_access_token = await checkAndGetWxGzhAccessToken()
  if(!wx_gzh_access_token) {
    return { code: "E5001", errMsg: "there is no wx_gzh_access_token" }
  }
  const data8 = await getWxGzhUserInfo(wx_gzh_openid)
  if(!data8) {
    return { code: "E5004", errMsg: "there is no data8 from wx gzh" }
  }
  console.log("let me see data8:::")
  console.log(data8)

  // 9. set thirdData as new data (data8)
  wx_gzh.subscribe = data8.subscribe
  if(data8.language) wx_gzh.language = data8.language
  if(data8.subscribe_scene) wx_gzh.subscribe_scene = data8.subscribe_scene
  if(data8.subscribe_time) wx_gzh.subscribe_time = data8.subscribe_time
  thirdData.wx_gzh = wx_gzh

  // 10. sign up
  const arg10: SignUpParam2 = { wx_gzh_openid, wx_gzh_userinfo: data8 }
  const res10 = await sign_up(ctx, body, arg10, client_key, thirdData)
  return res10
}

async function handle_github_oauth(
  ctx: FunctionContext,
  body: Record<string, string>,
): Promise<LiuRqReturn<Res_UserLoginNormal>> {
  // 1. check out parameters
  const res1 = checkOAuthParams(body)
  const { code: code1, data: data1 } = res1
  if(code1 !== "0000" || !data1) {
    return res1 as LiuErrReturn
  }
  const { oauth_code, client_key } = data1

  // 2. get client_id & client_secret
  const _env = process.env
  const client_id = _env.LIU_GITHUB_OAUTH_CLIENT_ID
  const client_secret = _env.LIU_GITHUB_OAUTH_CLIENT_SECRET
  if(!client_id || !client_secret) {
    return { code: "E5001", errMsg: "no client_id or client_secret on backend" }
  }

  // 3. 使用 code 去换 access_token
  const body3 = {
    client_id,
    client_secret,
    code: oauth_code,
  }
  let access_token = ""
  const res3 = await liuReq(GH_OAUTH_ACCESS_TOKEN, body3)

  // 4. 解析出 access_token
  const data4 = res3?.data ?? {}
  console.log("github data4: ")
  console.log(data4)
  access_token = data4?.access_token
  if(!access_token) {
    console.warn("cannot get github access_token")
    console.log(" ")
    if(data4?.error === undefined) {
      console.log(res3)
      console.log(" ")
    }
    return { code: "E5004", errMsg: "no access_token from GitHub" }
  }

  // 5. 使用 access_token 去换用户信息
  const res5 = await liuReq(GH_API_USER, undefined, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${access_token}`,
    },
  })

  // 6. 解析出有用的 user data from GitHub
  const data6 = res5?.data ?? {}
  console.log("github data6: ")
  console.log(data6)
  console.log(" ")

  // login: 为 github 的用户名，可以用来初始化 name
  // email: 正如其名
  let { login, email, id: github_id } = data6
  email = isEmailAndNormalize(email)
  if(!login) {
    return {
      code: "E5004",
      errMsg: "there is no login from github api user"
    }
  }
  if(!email) {
    return {
      code: "U0002",
      errMsg: "there is no email from github api user"
    }
  }
  if(!github_id || typeof github_id !== "number") {
    return {
      code: "E5004",
      errMsg: "github_id is supposed to number"
    }
  }

  const thirdData: UserThirdData = { github: data6 }

  // 7. 使用 github_id 去找用户
  const res7 = await findUserByGitHubId(github_id)

  // 8.1. 使用 github_id 查找后，发现拒绝登录或异常
  if(res7.type === 1) {
    return res7.rqReturn
  }
  // 8.2. 使用 github_id 查找后，找到可供登录的用户们
  if(res7.type === 2) {
    const res8_2 = await sign_in(ctx, body, res7.userInfos, { client_key, thirdData })
    return res8_2
  }
  
  // 9. 使用 email 去找用户
  const res9 = await signInUpViaEmail(ctx, body, email, client_key, thirdData)
  return res9
}

/** 使用 email 进行登录或注册 */
async function signInUpViaEmail(
  ctx: FunctionContext,
  body: Record<string, string>,
  email: string,
  client_key?: string,
  thirdData?: UserThirdData,
) {
  const res1 = await findUserByEmail(email)

  // 拒绝登录、或遭遇异常
  if(res1.type === 1) {
    return res1.rqReturn
  }

  // 去登录
  if(res1.type === 2) {
    const res2 = await sign_in(ctx, body, res1.userInfos, { client_key, thirdData })
    return res2
  }

  // 去注册
  const res3 = await sign_up(ctx, body, { email }, client_key, thirdData)
  return res3
}

/*************************** 登录 ************************/
interface SignInOpt {
  client_key?: string
  thirdData?: UserThirdData
  justSignUp?: boolean           // 若为 undefined 当 false 处理
}

async function sign_in(
  ctx: FunctionContext,
  body: Record<string, string>,
  userInfos: LiuUserInfo[],
  opt: SignInOpt,
): Promise<LiuRqReturn<Res_UserLoginNormal>> {

  // 1. 判断是否为多个 userInfo
  const uLength = userInfos.length
  if(uLength === 0) {
    return { code: "E5001", errMsg: "there is no userInfo to sign in" }
  }
  if(uLength > 1) {
    const res0 = await sign_multi_in(body, userInfos, opt.thirdData)
    return res0
  }

  // 2. 以下为只有一个 userInfo 的情况
  const theUserInfo = userInfos[0]
  let { user, spaceMemberList } = theUserInfo

  // 3. 检查 member 是否 "DEACTIVATED"，若是，恢复至 "OK"
  spaceMemberList = await turnMembersIntoOkWhileSigningIn(theUserInfo)
  
  // 4. 检查 user 是否 "DEACTIVATED" 或 "REMOVED"，若是，恢复至 "NORMAL"
  //    检查 是否要用当前用户本地传来的 theme 或 language
  //    更新 lastEnterStamp
  user = await handleUserWhileSigningIn(user, body, opt.thirdData)

  // 5. 去创建 token，并存到缓存里
  const workspaces = spaceMemberList.map(v => v.spaceId)
  const tokenData = await insertToken(ctx, body, user, workspaces, opt.client_key)
  if(!tokenData) {
    return { code: "E5001", errMsg: "cannot get serial_id" }
  }

  const token = tokenData.token
  const serial_id = tokenData._id
  const platform = tokenData.platform

  // 6. 检查是否存在过多 token
  if(!opt.justSignUp) {
    await checkIfTooManyTokens(user._id, platform)
  }

  // 7. 构造返回数据
  const obj3: Res_UserLoginNormal = {
    email: user.email,
    open_id: user.open_id,
    github_id: user.github_id,
    theme: user.theme,
    language: user.language,
    spaceMemberList,
    subscription: user.subscription,
    serial_id,
    token,
    userId: user._id,
  }

  return { code: "0000", data: obj3 }
}

async function sendLoginMsgToWxGzhUser(
  ctx: FunctionContext,
  wx_gzh_openid: string,
  login_way: "wx-gzh-scan",
  opt: GetLangValOpt,
) {
  const { t } = useI18n(userLoginLang, opt)
  let msg = t("login_success")

  // 1. Login Way
  msg += `\n\n`
  let way1 = login_way === "wx-gzh-scan" ? t("wechat_scan") : t("_unknown")
  msg += t("login_way", { way: way1 })

  // 2. Operate Time
  msg += `\n`
  const locale = getCurrentLocale(opt)
  const time = displayTime(getNowStamp(), locale, opt.body?.x_liu_timezone)
  msg += t("operate_time", { time })

  // 3. IP Address
  const ip = getIp(ctx)
  if(ip) {
    msg += `\n`
    msg += t("ip_address", { ip })
    const ipGEO = getIpGeo(ctx)
    if(ipGEO) msg += ` (${ipGEO})`
  }

  // 4. Device info
  const deviceStr = getDeviceI18nStr(ctx, opt)
  if(deviceStr) {
    msg += `\n`
    msg += t("device_info", { device: deviceStr })
  }
  
  // console.log("see msg: ")
  // console.log(msg)

  const wx_gzh_access_token = await checkAndGetWxGzhAccessToken()
  if(!wx_gzh_access_token) {
    console.warn("there is no wx_gzh_access_token in sendLoginMsgToWxGzhUser")
    return { code: "E5001", errMsg: "there is no wx_gzh_access_token" }
  }
  
  await sendWxTextMessage(wx_gzh_openid, wx_gzh_access_token, msg)
}

function getDeviceI18nStr(
  ctx: FunctionContext,
  opt: GetLangValOpt,
) {
  const userAgent = ctx.headers?.['user-agent']
  const x_liu_device = opt.body?.x_liu_device
  let deviceStr = normalizeUserAgent(userAgent, x_liu_device)
  const { t } = useI18n(userLoginLang, opt)

  if(deviceStr.includes("WeCom")) {
    deviceStr = deviceStr.replace("WeCom", t("wecom_client"))
  }
  else if(deviceStr.includes("WeChat")) {
    deviceStr = deviceStr.replace("WeChat", t("wechat_client"))
  }
  else if(deviceStr.includes("Alipay")) {
    deviceStr = deviceStr.replace("Alipay", t("alipay_client"))
  }
  else if(deviceStr.includes("DingTalk")) {
    deviceStr = deviceStr.replace("DingTalk", t("dingtalk_client"))
  }
  else if(deviceStr.includes("Feishu")) {
    deviceStr = deviceStr.replace("Feishu", t("feishu_client"))
  }
  else if(deviceStr.includes("Quark")) {
    deviceStr = deviceStr.replace("Quark", t("quark_client"))
  }
  else if(deviceStr.includes("UCBrowser")) {
    deviceStr = deviceStr.replace("UCBrowser", t("uc_client"))
  }
  else if(deviceStr.includes("HuaweiBrowser")) {
    deviceStr = deviceStr.replace("HuaweiBrowser", t("huawei_browser"))
  }
  
  if(deviceStr.includes("Harmony")) {
    deviceStr = deviceStr.replace("Harmony", t("harmony_os"))
  }
  if(deviceStr.includes("Android")) {
    deviceStr = deviceStr.replace("Android", t("android"))
  }
  return deviceStr
}



async function tryToSignInWithWxGzhOpenId(
  ctx: FunctionContext,
  body: Record<string, string>,
  wx_gzh_openid: string,
  opt: SignInOpt,
): Promise<LiuRqReturn<Res_UserLoginNormal> | undefined> {
  const res1 = await findUserByWxOpenId(wx_gzh_openid)
  if(res1.type === 1) {
    return res1.rqReturn
  }
  if(res1.type === 2) {
    const res2 = await sign_in(ctx, body, res1.userInfos, opt)

    // handle avatar
    const userInfo = res1.userInfos[0]
    const user = userInfo?.user
    if(user && opt.thirdData) {
      handle_avatar(user, opt.thirdData)
    }

    return res2
  }
}


/** 登录后，检查 token 是否过多，过多的拿去销毁 */
async function checkIfTooManyTokens(
  userId: string,
  platform: SupportedClient,
) {
  const max = clientMaximum[platform]
  if(!max) return

  const w = { userId, platform }
  const q = db.collection("Token").where(w).orderBy("expireStamp", "desc")
  const res1 = await q.skip(max).get<Table_Token>()
  const list = res1.data
  if(list.length < 1) return
  const id = list[0]._id
  if(!id) return

  console.log("checkIfTooManyTokens res1: ")
  console.log(res1)
  console.log(" ")

  const u = { isOn: "N", updatedStamp: getNowStamp() }
  const res2 = await db.collection("Token").where({ _id: id }).update(u)
  console.log("checkIfTooManyTokens res2: ")
  console.log(res2)
  console.log(" ")
}

/** 当用户登录时，去修改 user 上的必要信息 */
async function handleUserWhileSigningIn(
  user: Table_User,
  body: Record<string, any>,
  thirdData?: UserThirdData,
) {
  const u: Partial<Table_User> = {}
  const { oState, _id } = user

  if(oState === "DEACTIVATED" || oState === "REMOVED") {
    u.oState = "NORMAL"
  }

  const oldThirdData = user.thirdData ?? {}
  const oldWxGzh = oldThirdData?.wx_gzh
  const newGoogle = thirdData?.google
  const newGitHub = thirdData?.github
  const newWxGzh = thirdData?.wx_gzh
  if(newGoogle) {
    oldThirdData.google = newGoogle
    u.thirdData = oldThirdData
  }
  if(newGitHub) {
    oldThirdData.github = newGitHub
    u.thirdData = oldThirdData
  }
  if(newWxGzh) {
    oldThirdData.wx_gzh = { ...oldWxGzh, ...newWxGzh }
    u.thirdData = oldThirdData
  }
  
  const bTheme = normalizeToLocalTheme(body.theme)
  const bLang = normalizeToLocalLocale(body.language)
  if(bTheme !== "system" && bTheme !== user.theme) {
    u.theme = bTheme
  }
  if(bLang !== "system" && bLang !== user.language) {
    u.language = bLang
  }

  const systemTheme = body["x_liu_theme"] as SupportedTheme
  const systemLanguage = body["x_liu_language"]
  const userTimezone = body['x_liu_timezone']
  u.systemTheme = systemTheme
  u.systemLanguage = systemLanguage
  u.timezone = userTimezone

  if(!user.open_id) {
    u.open_id = createOpenId()
  }

  const now = getNowStamp()
  u.lastEnterStamp = now
  u.updatedStamp = now

  const q = db.collection("User").where({ _id })
  const res = await q.update(u)
  user = { ...user, ...u }
  
  return user
}


/** 将 DEACTIVATED 的 member 切换成 OK */
async function turnMembersIntoOkWhileSigningIn(
  userInfo: LiuUserInfo,
) {
  const { spaceMemberList, user } = userInfo

  // 1. 检查是否有 DEACTIVATED 的
  const list = spaceMemberList.filter(v => v.member_oState === "DEACTIVATED")
  if(list.length < 1) {
    return spaceMemberList
  }
  
  // 2. 去更新
  const w = { user: user._id, oState: "DEACTIVATED" }
  const u = { oState: "OK", updatedStamp: getNowStamp() }
  const q = db.collection("Member").where(w)
  const res = await q.update(u, { multi: true })
  console.warn("turnMembersIntoOkWhileSigningIn res.......")
  console.log(res)
  console.log(" ")

  spaceMemberList.forEach(v => {
    if(v.member_oState === "DEACTIVATED") {
      v.member_oState = "OK"
    }
  })

  return spaceMemberList
}

/********************* 有多个账号，供用户登录 **********************/
async function sign_multi_in(
  body: Record<string, string>,
  userInfos: LiuUserInfo[],
  thirdData?: UserThirdData,
): Promise<LiuRqReturn<Res_UserLoginNormal>> {
  if(userInfos.length < 2) {
    return { 
      code: "E5001", 
      errMsg: "userInfos.length > 1 is required in sign_multi_in"
    }
  }

  const user_ids = userInfos.map(v => v.user._id)
  const multi_credential = createCredentialForUserSelect()
  const now = getNowStamp()
  const expireStamp = now + (30 * MINUTE)
  const basic1 = getBasicStampWhileAdding()

  const obj1: PartialSth<Table_Credential, "_id"> = {
    credential: multi_credential,
    infoType: "users-select",
    expireStamp,
    user_ids,
    thirdData,
    ...basic1,
  }
  const res = await db.collection("Credential").add(obj1)
  const multi_credential_id = getDocAddId(res)
  if(!multi_credential_id) {
    return { code: "E5001", errMsg: "multi_credential_id cannot be got" }
  }

  const multi_users = getRes_ULN_User(userInfos)

  const obj2: Res_UserLoginNormal = {
    multi_users,
    multi_credential,
    multi_credential_id,
  }

  return { code: "0000", data: obj2 }
}

/** 将 userInfos 转成 Res_ULN_User */
function getRes_ULN_User(
  userInfos: LiuUserInfo[],
) {
  const list: Res_ULN_User[] = []
  for(let i=0; i<userInfos.length; i++) {
    const v = userInfos[i]
    const { user, spaceMemberList } = v

    const userId = user._id
    const createdStamp = user.insertedStamp

    let lsam = spaceMemberList.find(v2 => v2.spaceType === "ME")
    if(!lsam) {
      lsam = spaceMemberList.find(v2 => v2.space_owner === userId)
    }
    if(!lsam) {
      lsam = spaceMemberList[0]
    }
    
    const obj: Res_ULN_User = {
      ...lsam,
      userId,
      createdStamp,
    }
    list.push(obj)
  }

  return list
}


// 关键的登录 id，比如 email 或 phone 或其他平台的 openid
interface SignUpParam2 {
  email?: string
  phone?: string
  wx_gzh_openid?: string
  wx_gzh_userinfo?: Wx_Res_GzhUserInfo
}

/*************************** 注册 ************************/
async function sign_up(
  ctx: FunctionContext,
  body: Record<string, string>,
  param2: SignUpParam2,
  client_key?: string,
  thirdData?: UserThirdData,
): Promise<LiuRqReturn<Res_UserLoginNormal>> {
  // 1. init user
  const res1 = await init_user(body, param2, thirdData)
  const { code, data: userInfos } = res1
  if(code !== "0000" || !userInfos) {
    return res1 as LiuErrReturn
  }

  // 2. sign in
  const signInOpt = { client_key, thirdData, justSignUp: true }
  const res4 = await sign_in(ctx, body, userInfos, signInOpt)

  // 3. download and upload avatar if it exists
  const userInfo = userInfos[0]
  const user = userInfo?.user
  if(user && thirdData) {
    handle_avatar(user, thirdData)
  }

  // 4. tag user's language for wx gzh
  const wx_gzh_openid = param2.wx_gzh_openid
  const wx_gzh_userinfo = param2.wx_gzh_userinfo
  if(user && wx_gzh_userinfo && wx_gzh_openid) {
    tagWxUserLang(wx_gzh_openid, user, wx_gzh_userinfo)
  }

  return res4
}

async function handle_avatar(
  user: Table_User,
  thirdData: UserThirdData,
) {
  // 0. get param
  const userId = user._id

  // 1. get cloud_url & prefix from thirdData
  let cloud_url = ""
  let prefix = ""
  if(thirdData.google?.picture) {
    cloud_url = thirdData.google.picture
    prefix = "google-avatar"
  }
  else if(thirdData.github?.avatar_url) {
    cloud_url = thirdData.github.avatar_url
    prefix = "github-avatar"
  }
  else if(thirdData.wx_gzh?.headimgurl) {
    cloud_url = thirdData.wx_gzh.headimgurl
    prefix = "weixin-avatar"
  }

  // console.log("handle_avatar::")
  // console.log("cloud_url: ", cloud_url)
  // console.log("prefix: ", prefix)

  if(!cloud_url || !prefix) return true

  // 2. check out env
  const _env = process.env
  const qiniu_access_key = _env.LIU_QINIU_ACCESS_KEY
  const qiniu_secret_key = _env.LIU_QINIU_SECRET_KEY
  if(!qiniu_access_key || !qiniu_secret_key) {
    console.log("qiniu_access_key or qiniu_secret_key is not set")
    return
  }

  // 3. look up the user's members
  const mCol = db.collection("Member")
  const w3: Partial<Table_Member> = { user: userId }
  const res3 = await mCol.where(w3).get<Table_Member>()
  let members = res3.data
  if(members.length < 1) return true
  members = members.filter(v => !Boolean(v.avatar?.url))
  if(members.length < 1) return true

  // 4. download and upload
  const res4 = await downloadAndUpload({
    url: cloud_url,
    oss: "qiniu",
    prefix,
    type: "image",
  })
  const { code: code4, data: data4 } = res4
  if(code4 !== "0000" || !data4) {
    console.warn("downloadAndUpload failed")
    console.log(res4)
    return
  }

  // 5. get Cloud_ImageStore from data4
  if(data4.resType !== "image") {
    console.warn("downloadAndUpload resType is not image")
    console.log(res4)
    return
  }
  const image = data4.image

  // 6. define a function to update member
  const _updateMember = async (member: Table_Member) => {
    if(member.avatar?.url) return
    const now6 = getNowStamp()
    const u6: Partial<Table_Member> = {
      avatar: image,
      updatedStamp: now6,
      editedStamp: now6,
    }
    const res6 = await mCol.doc(member._id).update(u6)
  }

  // 7. update members
  for(let i=0; i<members.length; i++) {
    const m7 = members[i]
    await _updateMember(m7)
    if(i > 2) break
  }
  
  return true
}


export async function init_user(
  body: Record<string, string | undefined>,
  param2: SignUpParam2,
  thirdData?: UserThirdData,
): Promise<LiuRqReturn<LiuUserInfo[]>> {
  const { email, phone, wx_gzh_openid } = param2
  if(!email && !phone && !wx_gzh_openid) {
    return { code: "E5001", errMsg: "there is no required data in sign_up" }
  }

  const systemTheme = body["x_liu_theme"] as SupportedTheme
  const systemLanguage = body["x_liu_language"]

  // 1. construct a user
  const basic1 = getBasicStampWhileAdding()
  const open_id = createOpenId()
  const github_id = thirdData?.github?.id
  const user: PartialSth<Table_User, "_id"> = {
    ...basic1,
    oState: "NORMAL",
    email,
    phone,
    open_id,
    wx_gzh_openid,
    thirdData,
    theme: "system",
    systemTheme,
    language: "system",
    systemLanguage,
  }
  if(typeof github_id === "number" && github_id > 0) {
    user.github_id = github_id
  }

  // 2. create the user
  const res2 = await db.collection("User").add(user)
  const userId = getDocAddId(res2)
  if(!userId) {
    return { code: "E5001", errMsg: "fail to add an user" }
  }
  const newUser: Table_User = { ...user, _id: userId }

  // 3. create a workspace
  const basic3 = getBasicStampWhileAdding()
  const workspace: PartialSth<Table_Workspace, "_id"> = {
    ...basic3,
    infoType: "ME",
    oState: "OK",
    owner: userId,
  }
  const res3 = await db.collection("Workspace").add(workspace)
  const spaceId = getDocAddId(res3)
  if(!spaceId) {
    _cancelSignUp({ userId })
    return { code: "E5001", errMsg: "fail to add an workspace" }
  }

  // 4. create a member
  const name = getNameFromThirdData(thirdData)
  const avatar = constructMemberAvatarFromThirdData(thirdData)
  const basic4 = getBasicStampWhileAdding()
  const member_noti: MemberNotification = {}
  if(thirdData?.wx_gzh?.subscribe) {
    member_noti.wx_gzh_toggle = true
  }
  const member: PartialSth<Table_Member, "_id"> = {
    spaceType: "ME",
    name,
    avatar,
    spaceId,
    user: userId,
    oState: "OK",
    notification: member_noti,
    ...basic4,
  }
  const res4 = await db.collection("Member").add(member)
  const memberId = getDocAddId(res4)
  if(!memberId) {
    _cancelSignUp({ userId, spaceId })
    return { code: "E5001", errMsg: "fail to add an member" }
  }

  // 5. construct LiuSpaceAndMember
  const liuSpaceAndMember: LiuSpaceAndMember = {
    memberId,
    member_name: name,
    member_avatar: avatar,
    member_oState: "OK",
    member_notification: member_noti,
    
    spaceId,
    spaceType: "ME",
    space_oState: "OK",
    space_owner: userId,
  }

  // 6. construct userInfos
  const userInfos: LiuUserInfo[] = [
    {
      user: newUser,
      spaceMemberList: [liuSpaceAndMember]
    }
  ]

  // 7. sign in
  return { code: "0000", data: userInfos }
}




function getNameFromThirdData(
  thirdData?: UserThirdData,
) {
  if(!thirdData) return
  const { 
    google: googleData, 
    github: githubData,
    wx_gzh: wxGzhData,
  } = thirdData

  const n1 = googleData?.given_name
  if(n1 && typeof n1 === "string") return n1

  const n2 = googleData?.name
  if(n2 && typeof n2 === "string") return n2

  const n3 = wxGzhData?.nickname
  if(n3 && typeof n3 === "string") return n3

  const n4 = githubData?.login
  if(n4 && typeof n4 === "string") return n4

}


function constructMemberAvatarFromThirdData(
  thirdData?: UserThirdData,
) {
  if(!thirdData) return
  const { 
    google: googleData, 
    github: githubData,
    wx_gzh: wxGzhData,
  } = thirdData

  const pic1 = googleData?.picture
  if(pic1 && typeof pic1 === "string") {
    return generateAvatar(pic1)
  }

  const pic2 = githubData?.avatar_url
  if(pic2 && typeof pic2 === "string") {
    return generateAvatar(pic2)
  }

  const pic3 = wxGzhData?.headimgurl
  if(pic3 && typeof pic3 === "string") {
    return generateAvatar(pic3)
  }

}


interface _CancelSignUpParam {
  userId: string
  spaceId?: string
  memberId?: string
}

async function _cancelSignUp(
  param: _CancelSignUpParam,
) {
  console.log("_cancelSignUp::")
  console.log(param)
  console.log(" ")

  const q1 = db.collection("User").where({ _id: param.userId })
  const res1 = await q1.remove()
  console.log("删除 user 的结果......")
  console.log(res1)
  console.log(" ")

  if(param.spaceId) {
    const q2 = db.collection("Workspace").where({ _id: param.spaceId })
    const res2 = await q2.remove()
    console.log("删除 workspace 的结果......")
    console.log(res1)
    console.log(" ")
  }

  if(param.memberId) {
    const q3 = db.collection("Member").where({ _id: param.memberId })
    const res3 = await q3.remove()
    console.log("删除 member 的结果......")
    console.log(res3)
    console.log(" ")
  }

  return true
}


/**
 * type 的数值含义
 * 1: 出错
 * 2: 正常
 * 3: 查无任何用户
 */
type FindUserRes = {
  type: 1
  rqReturn: LiuErrReturn
} | {
  type: 2
  userInfos: LiuUserInfo[]
} | {
  type: 3
}

/** look up user by openid */
async function findUserByWxOpenId(
  wx_gzh_openid: string,
) {
  const w: Partial<Table_User> = { wx_gzh_openid }
  const uCol = db.collection("User")
  const res1 = await uCol.where(w).get<Table_User>()
  const list = res1.data
  const res2 = await handleUsersFound(list)
  return res2
}

/** 使用 github_id 去寻找用户 */
async function findUserByGitHubId(
  github_id: number,
) {
  const w = { github_id }
  const res = await db.collection("User").where(w).get<Table_User>()
  const list = res.data
  const res2 = await handleUsersFound(list)
  return res2
}


/**
 * 使用 email 去查找用户
 * @param email 邮箱地址
 */
async function findUserByEmail(
  email: string
): Promise<FindUserRes> {
  email = email.toLowerCase()

  const w = { email }
  const res = await db.collection("User").where(w).get<Table_User>()
  // console.log("findUserByEmail res ----->")
  // console.log("res.code: ", res.code)
  // console.log("res.data: ", res.data)
  // console.log("res.ok: ", res.ok)
  // console.log(" ")
  const list = res.data
  const res2 = await handleUsersFound(list)
  return res2
}

/** 使用 userId 查找用户信息 */
async function findUserById(
  userId: string
): Promise<FindUserRes> {
  const res = await db.collection("User").doc(userId).get<Table_User>()
  const rData = res.data
  if(!rData) return { type: 3 }
  const res2 = await handleUsersFound([rData])
  return res2
}


/** 查找出匹配的 user 后
 * 去检查该用户是否异常，若都正常，去查找他们的 userInfos
*/
async function handleUsersFound(
  list: Table_User[],
): Promise<FindUserRes> {

  if(list.length < 1) return { type: 3 }

  const users = list.filter(v => {
    const oS = v.oState
    if(oS === "NORMAL" || oS === "DEACTIVATED" || oS === "REMOVED") return true
    return false
  })

  // 1. 如果有可登录的 user 们
  // 去查找 member 和 workspace
  if(users.length > 0) {
    const userInfos = await getUserInfos(users)
    if(userInfos.length > 0) {
      return { type: 2, userInfos }
    }
    return { type: 3 }
  }

  // 2. 仅看第一个查出的 user 是什么情况
  const u = list[0]
  if(u.oState === "DELETED") {
    return {
      type: 1,
      rqReturn: {
        code: "E5001", 
        errMsg: "getting a DELETED user while calling handleUsersFound",
      }
    }
  }
  if(u.oState === "LOCK") {
    return {
      type: 1,
      rqReturn: { code: "E4007" }
    }
  }

  return { type: 3 }
}

/********************** 初始化 ********************/
function handle_init() {
  const publicKey = getPublicKey()
  if(!publicKey) {
    return { code: `E5001`, errMsg: `there is no liu-rsa-key-pair in cloud.shared` }
  }

  const _env = process.env
  const githubOAuthClientId = _env.LIU_GITHUB_OAUTH_CLIENT_ID
  const githubOAuthClientSecret = _env.LIU_GITHUB_OAUTH_CLIENT_SECRET
  const googleOAuthClientId = _env.LIU_GOOGLE_OAUTH_CLIENT_ID
  const googleOAuthClientSecret = _env.LIU_GOOGLE_OAUTH_CLIENT_SECRET
  const wxGzhAppid = _env.LIU_WX_GZ_APPID
  const wxGzhAppSecret = _env.LIU_WX_GZ_APPSECRET
  const wxGzhLogin = _env.LIU_WX_GZ_LOGIN

  const state = generateState()
  const data: Record<string, string | undefined> = {
    publicKey,
    state,
  }

  // 如果 GitHub OAuth 有存在的话
  if(githubOAuthClientId && githubOAuthClientSecret) {
    data.githubOAuthClientId = githubOAuthClientId
  }

  // 如果 Google OAuth 有存在的话
  if(googleOAuthClientId && googleOAuthClientSecret) {
    data.googleOAuthClientId = googleOAuthClientId
  }

  // if wechat gzh exists
  if(wxGzhAppid && wxGzhAppSecret && wxGzhLogin === "01") {
    data.wxGzhAppid = wxGzhAppid
  }

  return { code: `0000`, data }
}

/** 去制造 state 并存到全局缓存里，再返回 */
function generateState() {
  const liuLoginState = getLiuLoginState()

  let state = ""
  let times = 0
  while(true) {
    if(times++ > 10) break
    state = createLoginState()
    const existed = liuLoginState.has(state)
    if(!existed) {
      const now = getNowStamp()
      liuLoginState.set(state, { num: 0, createdStamp: now })
      cloud.shared.set("liu-login-state", liuLoginState)
      break
    }
  }

  return state
}

/** 从 cloud.shared 中获取 liu-login-state 这个 map */
function getLiuLoginState() {
  const gShared = cloud.shared
  const map: Map<string, Shared_LoginState> = gShared.get('liu-login-state') ?? new Map()
  return map
}

/** 检测 state 是否正常，若正常返回 null，若不正常返回 LiuRqReturn */
function checkIfStateIsErr(state: any): LiuErrReturn | null {
  const liuLoginState = getLiuLoginState()
  if(!state || typeof state !== "string") {
    console.warn("the state is required")
    return { code: "U0004", errMsg: "the state is required" }
  }
  
  const res = liuLoginState.get(state)
  if(!res) {
    console.warn("the state is not in the cache.......")
    return { code: "U0004", errMsg: "the state is not in the cache" }
  }

  let { createdStamp, num } = res
  num++

  if(num > 6) {
    console.warn("the state has been used too many times.......")
    liuLoginState.delete(state)
    return { code: "U0004", errMsg: "the state has been used too many times" }
  }

  const now = getNowStamp()
  const diff = now - createdStamp
  const isMoreThan20Mins = diff > (20 * MINUTE)
  if(isMoreThan20Mins) {
    console.warn("the state has been expired........")
    liuLoginState.delete(state)
    return { code: "U0003", errMsg: "the state has been expired" }
  }

  
  liuLoginState.set(state, { createdStamp, num })
  return null
}

// 解密出 clientKey
function getClientKey(enc_client_key: any) {
  if(!enc_client_key || typeof enc_client_key !== "string") {
    return { code: "E4000", errMsg: "enc_client_key is required" }
  }

  const { plainText, errMsg, code } = decryptWithRSA(enc_client_key)
  if(errMsg || !plainText || plainText.length < 20) {
    return { code: code ?? "E5001", errMsg }
  }

  const idx = plainText.indexOf(PREFIX_CLIENT_KEY)
  const client_key = plainText.substring(PREFIX_CLIENT_KEY.length)
  if(idx !== 0 || !client_key) {
    return { code: "E4003", errMsg: "the prefix of client_key is not correct" }
  }
  
  return { client_key }
}

// 检测许可名单
async function checkAllowList(
  type: "email",
  value: string,
) {
  const end_1 = value.endsWith("@sjtu.edu.cn")
  if(end_1) {
    return true
  }
  const end_2 = value.endsWith("@alumni.sjtu.edu.cn")
  if(end_2) {
    return true
  }

  const isTest = TEST_EMAILS.includes(value)
  if(isTest) {
    return true
  }

  const w: Partial<Table_AllowList> = {
    type,
    isOn: "Y",
    value,
  }
  const res = await db.collection("AllowList").where(w).getOne()
  return Boolean(res.data)
}


interface CheckOAuthParams {
  oauth_code: string
  state: string
  client_key: string
}


// check out params for OAuth
function checkOAuthParams(
  body: Record<string, string>,
): LiuRqReturn<CheckOAuthParams> {

  // 检查 oauth_code
  const oauth_code = body.oauth_code
  if(!oauth_code) {
    return { code: "E4000", errMsg: "no oauth_code" }
  }

  // 检查 state
  const state = body.state
  const res0 = checkIfStateIsErr(state)
  if(res0) return res0

  // 检查 client_key
  const { client_key, code: code1, errMsg: errMsg1 } = getClientKey(body.enc_client_key)
  if(!client_key || code1) {
    return { code: code1 ?? "E5001", errMsg: errMsg1 }
  }

  return {
    code: "0000",
    data: {
      oauth_code,
      state,
      client_key,
    }
  }
}
