// 用户登录、注册、进入
import cloud from '@lafjs/cloud'
import type { 
  PartialSth,
  LiuRqReturn, 
  SupportedTheme,
  Shared_LoginState, 
  Table_User, 
  UserThirdData, 
  Table_Workspace,
  Table_Member,
} from "@/common-types"
import { decryptWithRSA, isEmailAndNormalize, getDocAddId } from "@/common-util"
import { getNowStamp, MINUTE } from "@/common-time"
import { createLoginState } from "@/common-ids"
import { Resend } from 'resend'

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
    res = await handle_github_oauth(body)
  }
  else if(oT === "google_oauth") {
    res = await handle_google_oauth(body)
  }
  else if(oT === "email") {
    res = await handle_email(body)
  }

  return res
}


async function handle_email(
  body: Record<string, string>,
) {
  const tmpEmail = body.email
  if(!tmpEmail) {
    return { code: "E4000", errMsg: "no email" }
  }

  const email = isEmailAndNormalize(tmpEmail)
  if(!email) {
    return { code: "E4000", errMsg: "the format of email is wrong" }
  }

  const state = body.state
  const res0 = checkIfStateIsErr(state)
  if(res0) return res0

  const _env = process.env
  const appName = _env.LIU_APP_NAME
  const resendApiKey = _env.LIU_RESEND_API_KEY
  const fromEmail = _env.LIU_RESEND_FROM_EMAIL
  if(!resendApiKey || !fromEmail) {
    return { code: "E5001", errMsg: "no resendApiKey or fromEmail on backend" } 
  }
  
  const resend = new Resend(resendApiKey)
  const res = await resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: email,
    subject: "Hello World!",
    text: `this is from ${appName}!`,
    tags: [
      {
        name: 'category',
        value: 'confirm_email',
      },
    ],
  })
  console.log("查看 resend 发送结果: ")
  console.log(res)
  console.log(" ")
   
  return { code: "0000", data: res }
}


async function handle_google_oauth(
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

  // 可以直接从 id_token 中获取用户基本信息
  // const id_token = res1_data?.id_token
  // if(id_token) {
  //   try {
  //     const id_res = jsonwebtoken.decode(id_token)
  //     console.log("id_res: ")
  //     console.log(id_res)
  //     console.log(" ")
  //   }
  //   catch(err) {
  //     console.warn("id_token 解析失败.........")
  //     console.log(err)
  //     console.log(" ")
  //   }
  // }


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
    return { code: "U0001", data: { email } }
  }

  return { code: "0000", msg: "先这样", data: res2_data }
}


async function handle_github_oauth(
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
  let { login, email } = res2_data
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

  const res3 = await findUserByEmail(email)

  // 拒绝登录、或遭遇异常
  if(res3.type === 1) {
    return res3.rqReturn
  }

  // 去登录
  if(res3.type === 2) {

  }

  // 去注册


  return { code: "0000", data: res2_data }
}


async function sign_in(
  body: Record<string, string>,
  user: Table_User,
  thirdData?: UserThirdData,
) {
  
}


// 关键的登录 id，比如 email 或 phone 或其他平台的 openid
interface SignUpParam2 {
  email?: string
  phone?: string
}

async function sign_up(
  body: Record<string, string>,
  param2: SignUpParam2,
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
  const now = getNowStamp()
  const user: PartialSth<Table_User, "_id"> = {
    insertedStamp: now,
    updatedStamp: now,
    oState: "NORMAL",
    email,
    phone,
    thirdData,
    theme: "system",
    systemTheme,
    language: "system",
    systemLanguage,
  }

  // 2. 去创造 User
  const db = cloud.database()
  const res1 = await db.collection("User").add(user)
  const userId = getDocAddId(res1)
  if(!userId) {
    return { code: "E5001", errMsg: "fail to add an user" }
  }
  const newUser: Table_User = {
    ...user,
    _id: userId,
  }

  // 3. 去创造 workspace
  const now2 = getNowStamp()
  const workspace: PartialSth<Table_Workspace, "_id"> = {
    insertedStamp: now,
    updatedStamp: now,
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
  const now3 = getNowStamp()


  // 5. 然后去登录
  await sign_in(body, newUser, thirdData)
  
}

interface _CancelSignUpParam {
  userId: string
  workspaceId?: string
  memberId?: string
}

async function _cancelSignUp(
  param: _CancelSignUpParam,
) {
  const db = cloud.database()

  console.log("_cancelSignUp::")
  console.log(param)
  console.log(" ")

  const q1 = db.collection("User").where({ _id: param.userId })
  const res1 = await q1.remove()
  console.log("删除 user 的结果......")
  console.log(res1)
  console.log(" ")

  if(param.workspaceId) {
    const q2 = db.collection("Workspace").where({ _id: param.workspaceId })
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



type FUBERes = {
  type: 1
  rqReturn: LiuRqReturn
} | {
  type: 2
  user: Table_User
} | {
  type: 3
}

/**
 * 使用 email 去查找用户
 * @param email 邮箱地址
 */
async function findUserByEmail(
  email: string
): Promise<FUBERes> {
  email = email.toLowerCase()

  const db = cloud.database()
  const w = {
    email,
  }
  const res = await db.collection("User").where(w).get<Table_User>()
  console.log("findUserByEmail res ----->")
  console.log("res.code: ", res.code)
  console.log("res.data: ", res.data)
  console.log("res.ok: ", res.ok)
  console.log(" ")
  const list = res.data
  if(list.length < 1) return { type: 3 }
  const u = list[0]
  
  if(u.oState === "DELETED") {
    return {
      type: 1,
      rqReturn: {
        code: "E5001", 
        errMsg: "getting a DELETED user while calling findUserByEmail",
      }
    }
  }
  if(u.oState === "LOCK") {
    return {
      type: 1,
      rqReturn: { code: "E4007" }
    }
  }

  return { type: 2, user: u }
}


function getPublicKey() {
  const keyPair = cloud.shared.get(`liu-rsa-key-pair`)
  const publicKey = keyPair?.publicKey
  if(!publicKey) return undefined
  return publicKey as string
}

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

function getLiuLoginState() {
  const gShared = cloud.shared
  const map: Map<string, Shared_LoginState> = gShared.get('liu-login-state') ?? new Map()
  return map
}


/** 检测 state 是否正常，若正常返回 null，若不正常返回 LiuRqReturn */
function checkIfStateIsErr(state: any): LiuRqReturn | null {
  const liuLoginState = getLiuLoginState()
  if(!state || typeof state !== "string") {
    return { code: "U0004" }
  }
  const res = liuLoginState.get(state)
  if(!res) {
    return { code: "U0004", errMsg: "the state is required" }
  }

  let { createdStamp, num } = res
  num++

  if(num > 3) {
    liuLoginState.delete(state)
    return { code: "U0004", errMsg: "the state has been used too many times" }
  }

  const now = getNowStamp()
  const diff = now - createdStamp
  const isMoreThan10Mins = diff > (10 * MINUTE)
  if(isMoreThan10Mins) {
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



