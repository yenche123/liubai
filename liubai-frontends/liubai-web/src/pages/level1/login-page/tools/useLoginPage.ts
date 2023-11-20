import { reactive } from "vue";
import type { LpData, LoginByThirdParty } from "./types";
import { useMyProfile } from "~/hooks/useCommon";
import type { BoolFunc } from "~/utils/basic/type-tool";
import cui from "~/components/custom-ui";
import { fetchInitLogin } from "../../tools/requests";
import ider from "~/utils/basic/ider"
import localCache from "~/utils/system/local-cache";
import thirdLink from "~/config/third-link";
import time from "~/utils/basic/time"
import { loadGoogleIdentityService } from "./handle-gis"

// 等待向后端调用 init 的结果
let initPromise: Promise<boolean>

export function useLoginPage() {
  const { myProfile } = useMyProfile()

  const lpData = reactive<LpData>({
    view: "main",
    email: "",
    accounts: [],
  })

  toGetLoginInitData(lpData)

  const onEmailSubmitted = (email: string) => {
    if(!isEverythingOkay(lpData.initCode)) return

    // TODO: 先直接跳到 lp-code 界面
    lpData.email = email
    lpData.view = "code"
  }

  const onSubmitCode = (code: string) => {
    // TODO: 先直接去打开 "accounts"
    const me = myProfile.value
    if(!me) {
      console.log("打不开我")
      return
    }
    lpData.accounts = [me]
    lpData.view = "accounts"
  }

  const onBackFromCode = () => {
    lpData.view = "main"
  }

  const onTapLoginViaThirdParty = async (tp: LoginByThirdParty) => {
    let res = await initPromise
    if(res) whenTapLoginViaThirdParty(tp, lpData)
  }


  return {
    lpData,
    onEmailSubmitted,
    onSubmitCode,
    onBackFromCode,
    onTapLoginViaThirdParty,
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

function showOtherTip(content_key: string) {
  cui.showModal({
    title_key: "login.err_login",
    content_key,
    showCancel: false,
  })
}

function toGetLoginInitData(
  lpData: LpData,
) {
  const _request = async (a: BoolFunc) => {
    const res = await fetchInitLogin()
    const code = res?.code
    const data = res?.data

    lpData.initCode = code
    if(data) {
      lpData.publicKey = data.publicKey
      lpData.githubOAuthClientId = data.githubOAuthClientId
      lpData.googleOAuthClientId = data.googleOAuthClientId
      lpData.state = data.state
      lpData.initStamp = time.getTime()

      // loadGoogleIdentityService(lpData)
    }

    a(true)
  }
  initPromise = new Promise(_request)
}