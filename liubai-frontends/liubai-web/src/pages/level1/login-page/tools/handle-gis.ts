import type { LpData } from "./types";
import thirdLink from "~/config/third-link"

/** 加载 Google Identity Service 脚本 */
export async function loadGoogleIdentityService(
  lpData: LpData,
) {

  const { googleOAuthClientId } = lpData
  if(!googleOAuthClientId) return
  
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

