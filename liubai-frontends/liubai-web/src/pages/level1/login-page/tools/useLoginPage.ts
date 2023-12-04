import { reactive } from "vue";
import type { LpData, LoginByThirdParty } from "./types";
import type { BoolFunc } from "~/utils/basic/type-tool";
import cui from "~/components/custom-ui";
import { fetchInitLogin, fetchSubmitEmail, fetchEmailCode } from "../../tools/requests";
import localCache from "~/utils/system/local-cache";
import thirdLink from "~/config/third-link";
import time from "~/utils/basic/time"
import { encryptTextWithRSA, showLoginErrMsg } from "../../tools/common-utils"
import { loadGoogleIdentityService } from "./handle-gis"
import liuApi from "~/utils/liu-api";

// 等待向后端调用 init 的结果
let initPromise: Promise<boolean>

// 避免 initPromise 还没 resolve 时，用户多次点击多次触发
let hasTap = false

export function useLoginPage() {
  const lpData = reactive<LpData>({
    view: "main",
    email: "",
    accounts: [],
    isSendingEmail: false,
    isSubmittingEmailCode: false,
  })

  toGetLoginInitData(lpData)


  // 等待 init 返回结果，并作简单的防抖节流
  const _waitInitLogin = async () => {
    if(hasTap) return false
    hasTap = true
    await initPromise
    hasTap = false
    return true
  }

  const onEmailSubmitted = async (email: string) => {
    const pass = await _waitInitLogin()
    if(!pass) return
    
    toSubmitEmailAddress(email, lpData)
  }

  // code 由 9 个字符组成，中间是一个 "-"
  const onSubmitCode = (code: string) => {
    toSubmitEmailAndCode(code, lpData)
  }

  const onBackFromCode = () => {
    lpData.view = "main"
  }

  const onTapLoginViaThirdParty = async (tp: LoginByThirdParty) => {
    const pass = await _waitInitLogin()
    if(!pass) return

    whenTapLoginViaThirdParty(tp, lpData)
  }


  return {
    lpData,
    onEmailSubmitted,
    onSubmitCode,
    onBackFromCode,
    onTapLoginViaThirdParty,
  }
}

async function toSubmitEmailAddress(
  email: string,
  lpData: LpData,
) {
  if(!isEverythingOkay(lpData.initCode)) return
  const { state, lastSendEmail = 1, publicKey } = lpData
  if(!state || !publicKey) return
  if(lpData.isSendingEmail) return

  const now = time.getTime()
  const sec = (now - lastSendEmail) / time.SECONED
  
  let canSubmit = false
  if(email !== lpData.email) canSubmit = true
  else if(sec > 20) canSubmit = true    // 等 20s 就好，21~60s 去检查状态

  // 如果不允许提交，直接切换到 "code" view
  if(!canSubmit) {
    lpData.view = "code"
    return
  }

  const enc_email = await encryptTextWithRSA(publicKey, email)
  if(!enc_email) {
    console.warn("加密 email 失败......")
    return
  }

  lpData.isSendingEmail = true
  const res = await fetchSubmitEmail(enc_email, state)
  lpData.isSendingEmail = false

  console.log("fetchSubmitEmail res: ")
  console.log(res)
  console.log(" ")

  const { code, errMsg } = res
  if(code === "E4003" && errMsg === "last_event: bounced") {
    showEmailTip("login.err_3", "😭")
    return
  }
  else if(code === "U0004" || code === "U0003") {
    console.warn("发送 email 出现关于 state 的异常")
    console.log(code)
    console.log(" ")
    showOtherTip("login.err_5", true)
    return
  }
  else if(code === "E4003" && errMsg === "last_event: complained") {
    showEmailTip("login.err_2", "🥲")
  }

  lpData.email = email
  lpData.view = "code"
  lpData.lastSendEmail = time.getTime()
}

/** 记得做防抖节流，避免多次点击 */
async function toSubmitEmailAndCode(
  code: string,
  lpData: LpData,
) {
  const { email, state, lastSubmitEmailCode = 1, publicKey } = lpData
  if(!state || !publicKey || !email) return
  if(lpData.isSubmittingEmailCode) return

  const now = time.getTime()
  const milli = (now - lastSubmitEmailCode)
  if(milli < 1000) {
    cui.showSnackBar({ text_key: "login.err_4" })
    return
  }

  // 1. 获取加密的 email
  const enc_email = await encryptTextWithRSA(publicKey, email)
  if(!enc_email) {
    console.warn("加密 email 失败......")
    return
  }

  // 2. 获取 enc_client_key
  const onceData = localCache.getOnceData()
  const enc_client_key = onceData.enc_client_key
  if(!enc_client_key) {
    console.warn("enc_client_key is required")
    console.log(" ")
    return
  }

  // 3. 去登录
  lpData.lastSubmitEmailCode = now
  lpData.isSubmittingEmailCode = true
  const res = await fetchEmailCode(enc_email, code, state, enc_client_key)
  lpData.isSubmittingEmailCode = false

  console.log("登录后的结果.......")
  console.log(res)
  console.log(" ")
  const rCode = res.code
  const rData = res.data
  if(rCode === "E4003") {
    showEmailTip("login.err_6", "🙅")
  }
  else if(rCode !== "0000") {
    showLoginErrMsg(rCode, res.errMsg, res.showMsg)
  }

  // 正常时
  if(rCode === "0000") {

    // 1. 选择账户


    // 2. or 直接登录

  }


}


function isEverythingOkay(
  initCode?: string
) {
  if(initCode === "B0001") {
    cui.showModal({
      title: "🧑‍🔧",
      content_key: "tip.maintaining_1",
      showCancel: false,
      isTitleEqualToEmoji: true,
    })
    return false
  }
  if(initCode && initCode !== "0000") {
    cui.showModal({
      title: "🥲",
      content_key: "tip.err_1",
      content_opt: { code: initCode },
      showCancel: false,
      isTitleEqualToEmoji: true,
    })
    return false
  }
  return true
}


function whenTapLoginViaThirdParty(
  tp: LoginByThirdParty,
  lpData: LpData,
) {
  const { initCode } = lpData
  const isOkay = isEverythingOkay(initCode)
  if(!isOkay) return

  if(tp === "github") {
    handle_github(lpData)
  }
  else if(tp === "google") {
    handle_google(lpData)
  }
  else if(tp === "apple") {

  }
  
}

function handle_google(
  lpData: LpData,
) {
  const client_id = lpData.googleOAuthClientId
  if(!client_id) {
    showDisableTip("Google")
    return
  }
  
  // 30 个左右字符，来自于 google 的文档
  // https://developers.google.com/identity/openid-connect/openid-connect#createxsrftoken
  const state = lpData.state
  if(!state) {
    showOtherTip("login.err_1")
    return
  }
  localCache.setOnceData("googleOAuthState", state)
  
  const redirect_uri = window.location.origin + "/login-google"

  const url = new URL(thirdLink.GOOGLE_OAUTH2)
  let scope = "https://www.googleapis.com/auth/userinfo.email "
  scope += "https://www.googleapis.com/auth/userinfo.profile "
  scope += "openid"
  const sp = url.searchParams
  sp.append("scope", scope)
  sp.append("include_granted_scopes", "true")
  sp.append("response_type", "code")
  sp.append("state", state)
  sp.append("redirect_uri", redirect_uri)
  sp.append("client_id", client_id)
  const link = url.toString()
  location.href = link
}

function handle_github(
  lpData: LpData,
) {
  const client_id = lpData.githubOAuthClientId
  if(!client_id) {
    showDisableTip("GitHub")
    return
  }

  const state = lpData.state
  if(!state) {
    showOtherTip("login.err_1")
    return
  }
  localCache.setOnceData("githubOAuthState", state)

  const url = new URL(thirdLink.GITHUB_OAUTH)
  const sp = url.searchParams
  sp.append("client_id", client_id)
  sp.append("scope", "user:email")
  sp.append("state", state)
  const link = url.toString()
  location.href = link
}

function showDisableTip(thirdParty: string) {
  cui.showModal({
    title_key: "tip.tip",
    content_key: "login.cannot_login_via",
    content_opt: { thirdParty },
    showCancel: false,
  })
}

async function showOtherTip(
  content_key: string,
  reload: boolean = false
) {
  await cui.showModal({
    title_key: "login.err_login",
    content_key,
    showCancel: false,
  })
  if(reload) {
    liuApi.route.reload()
  }
}

function showEmailTip(
  content_key: string,
  title: string,
) {
  cui.showModal({
    title,
    content_key,
    showCancel: false,
    isTitleEqualToEmoji: true,
  })
}

function toGetLoginInitData(
  lpData: LpData,
) {
  const _request = async (a: BoolFunc) => {
    const res = await fetchInitLogin()
    const code = res?.code
    const data = res?.data

    console.log("code: ", code)
    console.log(" ")

    lpData.initCode = code
    if(!data || !data.publicKey) {
      a(false)
      return
    }

    lpData.publicKey = data.publicKey
    lpData.githubOAuthClientId = data.githubOAuthClientId
    lpData.googleOAuthClientId = data.googleOAuthClientId
    lpData.state = data.state
    lpData.initStamp = time.getTime()

    // loadGoogleIdentityService(lpData)
    a(true)
  }
  initPromise = new Promise(_request)
}