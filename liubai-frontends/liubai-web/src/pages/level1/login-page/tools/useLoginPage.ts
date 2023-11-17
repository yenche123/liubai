import { reactive } from "vue";
import type { LpData, LoginByThirdParty } from "./types";
import { useMyProfile } from "~/hooks/useCommon";
import type { BoolFunc } from "~/utils/basic/type-tool";
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { Res_UserLoginInit } from "~/requests/data-types"
import cui from "~/components/custom-ui";
import liuUtil from "~/utils/liu-util";
import ider from "~/utils/basic/ider"
import localCache from "~/utils/system/local-cache";
import thirdLink from "~/config/third-link";
import {
  loadGoogleIdentityService
} from "./handle-gis"

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

  }
  else if(tp === "apple") {

  }
  
}

function handle_github(
  lpData: LpData,
) {
  const client_id = lpData.githubOAuthClientId
  if(!client_id) {
    showDisableTip("GitHub")
    return
  }

  const state = ider.createRandom()
  localCache.setLocalOnceData("githubOAuthState", state)

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

function toGetLoginInitData(
  lpData: LpData,
) {
  const _request = async (a: BoolFunc) => {

    const url = APIs.LOGIN
    const res = await liuReq.request<Res_UserLoginInit>(url, { operateType: "init" })

    console.log(`toGetLoginInitData res: `)
    console.log(res)
    console.log(" ")

    const code = res?.code
    const data = res?.data

    lpData.initCode = code
    if(data) {
      lpData.publicKey = data.publicKey
      lpData.githubOAuthClientId = data.githubOAuthClientId
      lpData.googleOAuthClientId = data.googleOAuthClientId
      // loadGoogleIdentityService(lpData)
    }

    a(true)
  }
  initPromise = new Promise(_request)
}