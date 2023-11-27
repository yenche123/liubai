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
  Shared_TokenUser,
  Res_ULN_User,
  Res_UserLoginNormal,
  Cloud_ImageStore,
  LiuSpaceAndMember,
  SupportedClient,
} from "@/common-types"
import { clientMaximum } from "@/common-types"
import { 
  decryptWithRSA, 
  getPublicKey, 
  isEmailAndNormalize, 
  getDocAddId,
  turnMemberAggsIntoLSAMs,
  getSuffix,
} from "@/common-util"
import { getNowStamp, MINUTE, DAY, getBasicStampWhileAdding } from "@/common-time"
import { 
  createCredentialForUserSelect, 
  createLoginState, 
  createToken,
  createImgId,
} from "@/common-ids"
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

  const opt: UserThirdData = { google: res2_data }
  const res3 = await signInUpViaEmail(body, email, client_key, opt)
  return res3
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

  const opt: UserThirdData = { github: res2_data }
  const res3 = await signInUpViaEmail(body, email, client_key, opt)
  return res3
}

/** 使用 email 进行登录或注册 */
async function signInUpViaEmail(
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
    const res2 = await sign_in(body, res1.userInfos, { client_key, thirdData })
    return res2
  }

  // 去注册
  const res3 = await sign_up(body, { email }, client_key, thirdData)
  return res3
}

/*************************** 登录 ************************/
interface SignInOpt {
  client_key?: string
  thirdData?: UserThirdData
  justSignUp?: boolean           // 若为 undefined 当 false 处理
}

async function sign_in(
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
    const res0 = await sign_multi_in(body, userInfos, opt.client_key, opt.thirdData)
    return res0
  }

  // 2. 以下为只有一个 userInfo 的情况
  const theUserInfo = userInfos[0]
  let { user, spaceMemberList } = theUserInfo

  // 3. 检查 member 是否 "DEACTIVATED"，若是，恢复至 "OK"
  spaceMemberList = await turnMembersIntoOkWhileSigningIn(theUserInfo)
  
  // 4. 检查 user 是否 "DEACTIVATED" 或 "REMOVED"，若是，恢复至 "NORMAL"
  user = await turnUserIntoNormal(user)

  // 5. 去创建 token
  const token = createToken()
  const now = getNowStamp()
  const expireStamp = now + (30 * DAY)
  const userId = user._id
  const basic1 = getBasicStampWhileAdding()
  const platform = body['x_liu_client'] as SupportedClient
  const obj1: PartialSth<Table_Token, "_id"> = {
    ...basic1,
    token,
    expireStamp,
    userId,
    isOn: "Y",
    platform,
    client_key: opt.client_key,
    lastRead: now,
    lastSet: now,
  }
  const res1 = await db.collection("Token").add(obj1)
  const serial_id = getDocAddId(res1)
  if(!serial_id) {
    return { code: "E5001", errMsg: "cannot get serial_id" }
  }
  
  // 6. 存到 cloud.shared 中
  const tokenData: Table_Token = { _id: serial_id, ...obj1 }
  const workspaces = spaceMemberList.map(v => v.spaceId)
  const obj2: Shared_TokenUser = {
    token,
    tokenData,
    userData: user,
    workspaces,
    lastSet: now,
  }
  const tokenUser = getLiuTokenUser()
  tokenUser.set(serial_id, obj2)
  cloud.shared.set("liu-token-user", tokenUser)

  // 7. 检查是否存在过多 token
  if(!opt.justSignUp) {
    await checkIfTooManyTokens(user._id, platform)
  }

  // 8. 构造返回数据
  const obj3: Res_UserLoginNormal = {
    token,
    serial_id,
    spaceMemberList,
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

/** 将 DEACTIVATED 或 REMOVED 的 user 切换成 NORMAL */
async function turnUserIntoNormal(
  user: Table_User,
) {
  const { oState, _id } = user

  // 既不是 “不活跃” 也不是 “已移除”（注销保留期）
  if(oState !== "DEACTIVATED" && oState !== "REMOVED") return user

  const q = db.collection("User").where({ _id })
  const res = await q.update({ oState: "NORMAL", updatedStamp: getNowStamp() })
  console.log("turnUserIntoNormal res.........")
  console.log(res)
  console.log(" ")
  user.oState = "NORMAL"

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
  client_key?: string,
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
    client_key,
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
  const github_id = thirdData?.github?.id
  const user: PartialSth<Table_User, "_id"> = {
    ...basic1,
    oState: "NORMAL",
    email,
    phone,
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

  // 5. 去构造 LiuSpaceAndMember
  const liuSpaceAndMember: LiuSpaceAndMember = {
    spaceId,
    memberId,
    member_name: name,
    member_avatar: avatar,
    member_oState: "OK",
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
  const res4 = await sign_in(body, userInfos, { client_key, thirdData, justSignUp: true })
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
type FUBERes = {
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
): Promise<FUBERes> {
  email = email.toLowerCase()

  const w = { email }
  const res = await db.collection("User").where(w).get<Table_User>()
  console.log("findUserByEmail res ----->")
  console.log("res.code: ", res.code)
  console.log("res.data: ", res.data)
  console.log("res.ok: ", res.ok)
  console.log(" ")
  const list = res.data
  const res2 = await handleUsersFound(list)
  return res2
}

/** 查找出匹配的 user 后
 * 去检查该用户是否异常，若都正常，去查找他们的 userInfos
*/
async function handleUsersFound(
  list: Table_User[],
): Promise<FUBERes> {

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


/** 查找每个 user 下有哪些 member 和 workspace */
async function getUserInfos(
  users: Table_User[],
  filterMemberLeft: boolean = true,
) {
  const userInfos: LiuUserInfo[] = []

  for(let i=0; i<users.length; i++) {
    const v = users[i]
    const userId = v._id

    let m_oState = _.or(_.eq("OK"), _.eq("DEACTIVATED"))
    if(!filterMemberLeft) {
      m_oState = _.or(_.eq("OK"), _.eq("DEACTIVATED"), _.eq("LEFT"))
    }

    // 1. 用 lookup 去查找 member 和 workspace
    const res = await db.collection("Member").aggregate()
      .match({
        user: userId,
        oState: m_oState,
      })
      .sort({
        insertedStamp: 1,
      })
      .lookup({
        from: "Workspace",
        localField: "spaceId",
        foreignField: "_id",
        as: "spaceList",
      })
      .end()
    
    console.log("看一下 getUserInfos 中聚合搜索的结果: ")
    console.log(res)
    console.log(" ")

    const lsams = turnMemberAggsIntoLSAMs(res.data, filterMemberLeft)
    if(lsams.length) {
      userInfos.push({ user: v, spaceMemberList: lsams })
    }
  }
  return userInfos
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

/************ 从 cloud.shared 中获取 liu-login-state 这个 map ************8*/
function getLiuLoginState() {
  const gShared = cloud.shared
  const map: Map<string, Shared_LoginState> = gShared.get('liu-login-state') ?? new Map()
  return map
}

function getLiuTokenUser() {
  const gShared = cloud.shared
  const map: Map<string, Shared_TokenUser> = gShared.get('liu-token-user') ?? new Map()
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



