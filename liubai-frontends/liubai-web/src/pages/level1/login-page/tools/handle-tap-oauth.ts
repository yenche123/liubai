
import type { LpData } from "./types";
import { showDisableTip, showEmojiTip, showOtherTip } from "../../tools/show-msg"
import localCache from "~/utils/system/local-cache";
import thirdLink from "~/config/third-link";

export function handle_google(
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

export function handle_github(
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
