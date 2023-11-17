// 用户登录、注册、进入
import cloud from '@lafjs/cloud'
import jsonwebtoken from "jsonwebtoken"
import type { LiuRqReturn } from "@/common-types"
import { decryptWithRSA } from "@/common-util"

/************************ 一些常量 *************************/
// GitHub 使用 code 去换 accessToken
const GH_OAUTH_ACCESS_TOKEN = "https://github.com/login/oauth/access_token"

// GitHub 使用 accessToken 去获取用户信息
const GH_API_USER = "https://api.github.com/user"

// Google 使用 code 去换 accessToken
const GOOGLE_OAUTH_ACCESS_TOKEN = "https://oauth2.googleapis.com/token"


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
  else if(oT === "test") {
    res = handle_test(body)
  }
  else if(oT === "github_oauth") {
    res = await handle_github_oauth(body)
  }
  else if(oT === "google_oauth") {
    res = await handle_google_oauth(body)
  }

  return res
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

  const id_token = res1_data?.id_token
  if(id_token) {
    try {
      const id_res = jsonwebtoken.decode(id_token)
      console.log("id_res: ")
      console.log(id_res)
      console.log(" ")
    }
    catch(err) {
      console.warn("id_token 解析失败.........")
      console.log(err)
      console.log(" ")
    }
  }


  return { code: "0000", msg: "先这样", data: res1_data }
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

function handle_test(
  body: any,
) {
  const encryptedText = body.encryptedText
  if(!encryptedText) {
    return { code: "E4000", errMsg: "no encryptedText" }
  }
  const data = decryptWithRSA(encryptedText)
  return { code: "0000", data }
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

  const data: Record<string, string | undefined> = {
    publicKey,
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





