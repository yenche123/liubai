import type { LpData } from "./types";
import thirdLink from "~/config/third-link"

/** 加载 Google Identity Service 脚本 */
export async function loadGoogleIdentityService(
  lpData: LpData,
) {

  const { googleOAuthClientId } = lpData
  if(!googleOAuthClientId) return
  
  //@ts-expect-error: window.google
  if(window.google) return

  const s = document.createElement("script")
  s.async = true
  s.src = thirdLink.GOOGLE_GIS_SCRIPT
  console.time("GIS")
  s.onload = () => {
    console.timeEnd("GIS")
    console.log(" GIS 脚本已加载完成了..........")

    //@ts-expect-error: window.google
    console.log(window.google)
  }

  document.head.appendChild(s)
}

