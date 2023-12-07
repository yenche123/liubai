import localCache from "~/utils/system/local-cache";
import type { LpData } from "./types";
import thirdLink from "~/config/third-link"
import cui from "~/components/custom-ui";
import { fetchGoogleCredential } from "../../tools/requests";
import { afterFetchingLogin } from "../../tools/common-utils";
import { type RouteAndLiuRouter } from "~/routes/liu-router";
import { getClientKey } from "../../tools/common-tools";

type GIS_CredentialResponse = google.accounts.id.CredentialResponse

/** 加载 Google Identity Service 脚本 */
export async function loadGoogleIdentityService(
  rr: RouteAndLiuRouter,
  lpData: LpData,
) {

  const { googleOAuthClientId, initCode } = lpData
  if(!googleOAuthClientId) return
  if(initCode !== "0000") return
  
  if(window.google) return

  const s = document.createElement("script")
  s.async = true
  s.src = thirdLink.GOOGLE_GIS_SCRIPT
  console.time("GIS")
  s.onload = () => {
    console.timeEnd("GIS")
    
    const gAccounts = window.google?.accounts
    if(!gAccounts) return

    gAccounts.id.initialize({
      client_id: googleOAuthClientId,
      callback: (res) => {
        console.log("initialize callback..........")
        console.log(res)
        console.log(" ")
        handleCredentialResponse(rr, lpData, res)
      }
    })

    gAccounts.id.prompt((res) => {
        
      const isDisplayMoment = res.isDisplayMoment()
      const isDisplayed = res.isDisplayed()
      const isNotDisplayed = res.isNotDisplayed()
      const notDisplayedReason = res.getNotDisplayedReason()
      const isSkippedMoment = res.isSkippedMoment()
      const skippedReason = res.getSkippedReason()
      const isDismissedMoment = res.isDismissedMoment()
      const dimissedReason = res.getDismissedReason()
      const momentType = res.getMomentType()

      console.log(" ")
      console.log("prompt callback...........")
      console.log("isDisplayMoment: ", isDisplayMoment)
      console.log("isDisplayed: ", isDisplayed)
      console.log("isNotDisplayed: ", isNotDisplayed)
      console.log("notDisplayedReason: ", notDisplayedReason)
      console.log("isSkippedMoment: ", isSkippedMoment)
      console.log("skippedReason: ", skippedReason)
      console.log("isDismissedMoment: ", isDismissedMoment)
      console.log("dimissedReason: ", dimissedReason)
      console.log("momentType: ", momentType)
      console.log(" ")

      lpData.googleOneTapShown = isDisplayed
    })
  }

  document.head.appendChild(s)
}

async function handleCredentialResponse(
  rr: RouteAndLiuRouter,
  lpData: LpData,
  res: GIS_CredentialResponse,
) {

  // 1. 获取 google_id_token 和 state
  const google_id_token = res.credential
  const state = lpData.state
  if(!state) return

  // 2. 获取 enc_client_key
  const { enc_client_key } = getClientKey()
  if(!enc_client_key) return

  cui.showLoading({ title_key: "login.logging2" })
  const res2 = await fetchGoogleCredential(google_id_token, state, enc_client_key)
  cui.hideLoading()
  afterFetchingLogin(rr, res2)
}