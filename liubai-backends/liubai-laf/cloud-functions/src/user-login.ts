// 用户登录、注册、进入
import cloud from '@lafjs/cloud'
import type { LiuRqReturn, Shared_LoginState } from "@/common-types"
import { getNowStamp, decryptWithRSA, isEmailAndNormalize } from "@/common-util"
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
  const oauth_code = body.oauth_code
  if(!oauth_code) {
    return { code: "E4000", errMsg: "no oauth_code" }
  }
  const redirect_uri = body.oauth_redirect_uri
  if(!redirect_uri) {
    return { code: "E4000", errMsg: "no oauth_redirect_uri" }
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

  const { email, email_verified } = res2_data
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
  const oauth_code = body.oauth_code
  if(!oauth_code) {
    return { code: "E4000", errMsg: "no oauth_code" }
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

  return { code: "0000", data: res2_data }
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
  const gShared = cloud.shared
  const liuLoginState: Map<string, Shared_LoginState> = gShared.get('liu-login-state') ?? new Map()

  let state = ""
  let times = 0
  while(true) {
    if(times++ > 10) break
    state = createLoginState()
    const existed = liuLoginState.has(state)
    if(!existed) {
      const now = getNowStamp()
      liuLoginState.set(state, { num: 0, createdStamp: now })
      break
    }
  }

  return state
}





