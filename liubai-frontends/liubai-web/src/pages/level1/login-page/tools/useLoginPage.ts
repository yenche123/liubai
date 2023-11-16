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
  if(!client_id) return

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

async function testAES() {
  const key = await liuUtil.crypto.createKeyWithAES()
  console.log("key: ")
  console.log(key)
  console.log(" ")

  const plainText = "你好，很高兴认识你，我真的很荣幸能在这里遇见你🔓🎊🧑‍💻"
  const res = await liuUtil.crypto.encryptWithAES(plainText, key)
  console.log("res: ")
  console.log(res)
  console.log(" ")

  const res2 = await liuUtil.crypto.decryptWithAES(res, key)
  console.log("plainText: ")
  console.log(res2)
  console.log(" ")

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
    }

    a(true)
  }
  initPromise = new Promise(_request)
}

/** 加载 Google Identity Service 脚本 */
async function loadGoogleIdentityService(
  lpData: LpData,
) {

  const { googleOAuthClientId } = lpData
  if(!googleOAuthClientId) return



}