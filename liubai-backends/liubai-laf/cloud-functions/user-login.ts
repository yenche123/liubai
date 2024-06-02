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
  Cloud_ImageStore,
  LiuSpaceAndMember,
  SupportedClient,
  ServiceSendEmailsParam,
  Table_AllowList,
} from "@/common-types"
import { clientMaximum } from "@/common-types"
import { 
  decryptWithRSA, 
  getPublicKey, 
  isEmailAndNormalize, 
  getDocAddId,
  getSuffix,
  canPassByExponentialDoor,
  normalizeToLocalTheme,
  normalizeToLocalLocale,
  getUserInfos,
  insertToken,
} from "@/common-util"
import { getNowStamp, MINUTE, getBasicStampWhileAdding } from "@/common-time"
import { 
  createCredentialForUserSelect, 
  createLoginState,
  createImgId,
  createOpenId,
} from "@/common-ids"
import { checkIfEmailSentTooMuch, getActiveEmailCode, sendEmails } from "@/service-send"
import { userLoginLang, useI18n, getAppName } from '@/common-i18n'
import { OAuth2Client, type TokenPayload } from "google-auth-library"

/************************ 一些常量 *************************/
// GitHub 使用 code 去换 accessToken
const GH_OAUTH_ACCESS_TOKEN = "https://github.com/login/oauth/access_token"

// GitHub 使用 accessToken 去获取用户信息
const GH_API_USER = "https://api.github.com/user"

// Google 使用 code 去换 accessToken
const GOOGLE_OAUTH_ACCESS_TOKEN = "https://oauth2.googleapis.com/token"

// Google 使用 accessToken 去获取用户信息
const GOOGLE_API_USER = "https://www.googleapis.com/oauth2/v3/userinfo"

const PREFIX_CLIENT_KEY = "client_key_"

const db = cloud.database()
const _ = db.command


/************************ 函数们 *************************/

export async function main(ctx: FunctionContext) {
  console.log("welcome to user-login")

  // 0.1 检查 "登录功能" 是否关闭
  const env = process.env
  if(env.LIU_CLOUD_LOGIN === "02") {
    ctx.response?.send({ code: "B0002" })
    return false
  }

  const body = ctx.request?.body ?? {}
  const oT = body.operateType

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

  return res
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
  const res2 = await col.where({ _id: firstCre._id }).remove()
  console.log("删除 credential 的结果........")
  console.log(res2)
  console.log(" ")

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
  console.log("addVerifyNum res1: ")
  console.log(res1)
  console.log(" ")
}


/******************************** 向邮箱发送验证码 *************************/
async function handle_email(
  ctx: FunctionContext,
  body: Record<string, string>,
) {
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
  const expireStamp = getNowStamp() + 10 * MINUTE
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

  // 6. 构造邮件内容、去发送
  const appName = getAppName({ body })
  const { t } = useI18n(userLoginLang, { body })
  const subject = t('confirmation_subject')
  let text = t('confirmation_text_1', { appName, code: emailCode })
  text += t('confirmation_text_2')

  // 7. 去发送
  const dataSent: ServiceSendEmailsParam = {
    to: [email],
    subject,
    text,
  }
  const res4 = await sendEmails(dataSent)

  // 8. 处理发送后的结果
  handleEmailSent(cId, "resend", res4)

  // 9. 如果发送成功，去掉 data
  if(res4.code === "0000") {
    delete res4.data
  }


  return res4
}

function handleEmailSent(
  cId: string,
  send_channel: string,
  res4: LiuRqReturn<Record<string, any>>,
) {
  const u: Partial<Table_Credential> = {}
  const { code, data } = res4
  const now = getNowStamp()

  const q = db.collection("Credential").where({ _id: cId })

  if(code === "0000" && typeof (data?.id) === "string") {
    u.send_channel = send_channel
    u.email_id = data.id
    u.updatedStamp = now
    q.update(u)
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

  // 检查 oauth_code
  const oauth_code = body.oauth_code
  if(!oauth_code) {
    return { code: "E4000", errMsg: "no oauth_code" }
  }

  // 检查 redirect_uri
  const redirect_uri = body.oauth_redirect_uri
  if(!redirect_uri) {
    return { code: "E4000", errMsg: "no oauth_redirect_uri" }
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

  const _env = process.env
  const client_id = _env.LIU_GOOGLE_OAUTH_CLIENT_ID
  const client_secret = _env.LIU_GOOGLE_OAUTH_CLIENT_SECRET
  if(!client_id || !client_secret) {
    return { code: "E5001", errMsg: "no client_id or client_secret on backend" }
  }

  // 1. 使用 code 去换 access_token
  const body1 = {
    client_id,
    client_secret,
    code: oauth_code,
    redirect_uri,
    grant_type: "authorization_code",
  }
  let access_token = ""
  let res1: any
  try {
    res1 = await cloud.fetch.post(GOOGLE_OAUTH_ACCESS_TOKEN, body1)
  }
  catch(err) {
    console.warn("使用 Google code 去换取用户 access_token 失败")
    console.log(err)
    console.log(" ")
    return { 
      code: "E5003", 
      errMsg: "network err while getting google access_token with code",
    }
  }

  // 2. 解析出 access_token
  const res1_data = res1?.data ?? {}
  console.log("google oauth res1_data: ")
  console.log(res1_data)
  access_token = res1_data?.access_token
  if(!access_token) {
    console.warn("没有获得 google access_token")
    console.log(" ")
    if(res1_data?.error === undefined) {
      console.log(res1)
      console.log(" ")
    }
    return { code: "E5004", errMsg: "no access_token from GitHub" }
  }
  console.log(" ")

  // 3. 使用 access_token 去换用户信息
  let res2: any
  try {
    res2 = await cloud.fetch({
      url: GOOGLE_API_USER,
      method: "get",
      headers: {
        "Authorization": `Bearer ${access_token}`,
      }
    })
  }
  catch(err) {
    console.warn("使用 Google access_token 去换取用户信息 失败")
    console.log(err)
    console.log(" ")
    return { 
      code: "E5003", 
      errMsg: "network err while getting google user data with access_token",
    }
  }

  // 4. 解析出有用的 user data from Google
  const res2_data = res2?.data ?? {}
  console.log("google res2_data: ")
  console.log(res2_data)
  console.log(" ")

  let { email, email_verified } = res2_data
  email = isEmailAndNormalize(email)
  if(!email) {
    return { code: "U0002" }
  }
  if(!email_verified) {
    const rData: Res_UserLoginNormal = { email }
    return { code: "U0001", data: rData }
  }

  const opt: UserThirdData = { google: res2_data }
  const res3 = await signInUpViaEmail(ctx, body, email, client_key, opt)
  return res3
}


async function handle_github_oauth(
  ctx: FunctionContext,
  body: Record<string, string>,
) {

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

  const _env = process.env
  const client_id = _env.LIU_GITHUB_OAUTH_CLIENT_ID
  const client_secret = _env.LIU_GITHUB_OAUTH_CLIENT_SECRET
  if(!client_id || !client_secret) {
    return { code: "E5001", errMsg: "no client_id or client_secret on backend" }
  }

  // 1. 使用 code 去换 access_token
  const body1 = {
    client_id,
    client_secret,
    code: oauth_code,
  }
  let access_token = ""
  let res1: any
  try {
    res1 = await cloud.fetch({
      url: GH_OAUTH_ACCESS_TOKEN,
      method: "post",
      data: body1,
      timeout: 3000,
      responseType: "json",
      headers: {
        "Accept": "application/json",
      }
    })
  }
  catch(err) {
    console.warn("使用 GitHub code 去换取用户 access_token 失败")
    console.log(err)
    console.log(" ")
    return { 
      code: "E5003", 
      errMsg: "network err while getting github access_token with code",
    }
  }

  // 2. 解析出 access_token
  const res1_data = res1?.data ?? {}
  console.log("github res1_data: ")
  console.log(res1_data)
  access_token = res1_data?.access_token
  if(!access_token) {
    console.warn("没有获得 github access_token")
    console.log(" ")
    if(res1_data?.error === undefined) {
      console.log(res1)
      console.log(" ")
    }
    return { code: "E5004", errMsg: "no access_token from GitHub" }
  }
  console.log(" ")

  // 3. 使用 access_token 去换用户信息
  let res2: any
  try {
    res2 = await cloud.fetch({
      url: GH_API_USER,
      method: "get",
      headers: {
        "Authorization": `Bearer ${access_token}`,
      }
    })
  }
  catch(err) {
    console.warn("使用 GitHub access_token 去换取用户信息 失败")
    console.log(err)
    console.log(" ")
    return { 
      code: "E5003", 
      errMsg: "network err while getting github user data with access_token",
    }
  }

  // 4. 解析出有用的 user data from GitHub
  const res2_data = res2?.data ?? {}
  console.log("github res2_data: ")
  console.log(res2_data)
  console.log(" ")

  // login: 为 github 的用户名，可以用来初始化 name
  // email: 正如其名
  let { login, email, id: github_id } = res2_data
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

  const thirdData: UserThirdData = { github: res2_data }

  // 5. 使用 github_id 去找用户
  const res3 = await findUserByGitHubId(github_id)

  // 5.1. 使用 github_id 查找后，发现拒绝登录或异常
  if(res3.type === 1) {
    return res3.rqReturn
  }
  // 5.2. 使用 github_id 查找后，找到可供登录的用户们
  if(res3.type === 2) {
    const res3_1 = await sign_in(ctx, body, res3.userInfos, { client_key, thirdData })
    return res3_1
  }
  
  // 6. 使用 email 去找用户
  const res4 = await signInUpViaEmail(ctx, body, email, client_key, thirdData)
  return res4
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
): Promise<LiuRqReturn> {

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
  console.log("checkIfTooManyTokens res1: ")
  console.log(res1)
  console.log(" ")

  const list = res1.data
  if(list.length < 1) return
  const id = list[0]._id
  if(!id) return

  const u = { isOn: "N", updatedStamp: getNowStamp() }
  const res2 = await db.collection("Token").where({ _id: id }).update(u)
  console.log("res2: ")
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
  const oldGoogle = oldThirdData?.google
  const oldGitHub = oldThirdData?.github
  const newGoogle = thirdData?.google
  const newGitHub = thirdData?.github
  if(!oldGoogle && newGoogle) {
    oldThirdData.google = newGoogle
    u.thirdData = oldThirdData
  }
  if(!oldGitHub && newGitHub) {
    oldThirdData.github = newGitHub
    u.thirdData = oldThirdData
  }
  
  const bTheme = normalizeToLocalTheme(body.theme)
  const bLang = normalizeToLocalLocale(body.language)
  if(bTheme !== user.theme) {
    u.theme = bTheme
  }
  if(bLang !== user.language) {
    u.language = bLang
  }

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
  const { spaceMemberList, user} = userInfo

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
  console.log("turnMembersIntoOkWhileSigningIn res.......")
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
) {
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
}

/*************************** 注册 ************************/
async function sign_up(
  ctx: FunctionContext,
  body: Record<string, string>,
  param2: SignUpParam2,
  client_key?: string,
  thirdData?: UserThirdData,
) {
  const { email, phone } = param2
  if(!email && !phone) {
    return { code: "E5001", errMsg: "there is no required data in sign_up" }
  }

  let systemTheme = body["x_liu_theme"] as SupportedTheme
  if(systemTheme !== "light" && systemTheme !== "dark") {
    systemTheme = "light"
  }

  let systemLanguage = body["x_liu_language"]

  // 1. 构造 User
  const basic1 = getBasicStampWhileAdding()
  const open_id = createOpenId()
  const github_id = thirdData?.github?.id
  const user: PartialSth<Table_User, "_id"> = {
    ...basic1,
    oState: "NORMAL",
    email,
    phone,
    open_id,
    thirdData,
    theme: "system",
    systemTheme,
    language: "system",
    systemLanguage,
  }
  if(typeof github_id === "number" && github_id > 0) {
    user.github_id = github_id
  }

  // 2. 去创造 User
  const res1 = await db.collection("User").add(user)
  const userId = getDocAddId(res1)
  if(!userId) {
    return { code: "E5001", errMsg: "fail to add an user" }
  }
  const newUser: Table_User = { ...user, _id: userId }

  // 3. 去创造 workspace
  const basic2 = getBasicStampWhileAdding()
  const workspace: PartialSth<Table_Workspace, "_id"> = {
    ...basic2,
    infoType: "ME",
    oState: "OK",
    owner: userId,
  }
  const res2 = await db.collection("Workspace").add(workspace)
  const spaceId = getDocAddId(res2)
  if(!spaceId) {
    _cancelSignUp({ userId })
    return { code: "E5001", errMsg: "fail to add an workspace" }
  }

  // 4. 去创造 member
  const name = getNameFromThirdData(thirdData)
  const avatar = constructMemberAvatarFromThirdData(thirdData)
  const basic3 = getBasicStampWhileAdding()
  const member: PartialSth<Table_Member, "_id"> = {
    spaceType: "ME",
    name,
    avatar,
    spaceId,
    user: userId,
    oState: "OK",
    ...basic3,
  }
  const res3 = await db.collection("Member").add(member)
  const memberId = getDocAddId(res3)
  if(!memberId) {
    _cancelSignUp({ userId, spaceId })
    return { code: "E5001", errMsg: "fail to add an member" }
  }

  // 5. 去构造 LiuSpaceAndMember （个人工作区以及自己这个成员）
  const liuSpaceAndMember: LiuSpaceAndMember = {
    memberId,
    member_name: name,
    member_avatar: avatar,
    member_oState: "OK",

    spaceId,
    spaceType: "ME",
    space_oState: "OK",
    space_owner: userId,
  }

  // 6. 去构造 userInfo
  const userInfos: LiuUserInfo[] = [
    {
      user: newUser,
      spaceMemberList: [liuSpaceAndMember]
    }
  ]

  // 7. 最后去登录
  const signInOpt = { client_key, thirdData, justSignUp: true }
  const res4 = await sign_in(ctx, body, userInfos, signInOpt)
  return res4
}

function getNameFromThirdData(
  thirdData?: UserThirdData,
) {
  if(!thirdData) return
  const { google: googleData, github: githubData } = thirdData

  const n1 = googleData?.given_name
  if(n1 && typeof n1 === "string") return n1

  const n2 = googleData?.name
  if(n2 && typeof n2 === "string") return n2

  const n3 = githubData?.login
  if(n3 && typeof n3 === "string") return n3

}


function constructMemberAvatarFromThirdData(
  thirdData?: UserThirdData,
) {
  if(!thirdData) return
  const { google: googleData, github: githubData } = thirdData

  const now = getNowStamp()

  const _generateAvatar = (url: string) => {
    const imgId = createImgId()
    const suffix = getSuffix(url)
    const name = suffix ? `${imgId}.${suffix}` : imgId
    const obj: Cloud_ImageStore = {
      id: imgId,
      name,
      lastModified: now,
      url,
    }
    return obj
  }

  const pic1 = googleData?.picture
  if(pic1 && typeof pic1 === "string") {
    return _generateAvatar(pic1)
  }

  const pic2 = githubData?.avatar_url
  if(pic2 && typeof pic2 === "string") {
    return _generateAvatar(pic2)
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
  rqReturn: LiuRqReturn
} | {
  type: 2
  userInfos: LiuUserInfo[]
} | {
  type: 3
}

/** 使用 github_id 去寻找用户 */
async function findUserByGitHubId(
  github_id: number,
) {
  const w = { github_id }
  const res = await db.collection("User").where(w).get<Table_User>()
  console.log("findUserByGitHubId res ----->")
  console.log("res.code: ", res.code)
  console.log("res.data: ", res.data)
  console.log("res.ok: ", res.ok)
  console.log(" ")
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
function checkIfStateIsErr(state: any): LiuRqReturn | null {
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
  const isMoreThan15Mins = diff > (15 * MINUTE)
  if(isMoreThan15Mins) {
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
  const w: Partial<Table_AllowList> = {
    type,
    isOn: "Y",
    value,
  }
  const res = await db.collection("AllowList").where(w).getOne()
  return Boolean(res.data)
}



