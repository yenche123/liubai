import { reactive } from "vue";
import type { LpData, LoginByThirdParty } from "./types";
import { useMyProfile } from "~/hooks/useCommon";
import type { BoolFunc } from "~/utils/basic/type-tool";
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { Res_UserLoginInit } from "~/requests/data-types"
import cui from "~/components/custom-ui";
import liuUtil from "~/utils/liu-util";

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
    const res1 = await initPromise
    whenTapLoginViaThirdParty(lpData)
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


async function whenTapLoginViaThirdParty(
  lpData: LpData,
) {
  const { 
    initCode, 
    publicKey,
    ghOAuthClientId,
  } = lpData

  const isOkay = isEverythingOkay(initCode)
  if(!isOkay) return
  if(!publicKey) return

  const key = await liuUtil.crypto.importRsaPublicKey(publicKey)
  if(!key) return

  const text = `你好，很高兴认识你，我是 lb 这里是 laf 吗？加一点 emoji 🍫🤖🥱`
  const encryptedText = await liuUtil.crypto.encryptWithRSA(key, text)
  console.log("encryptedText: ")
  console.log(encryptedText)
  console.log(" ")

  const url = APIs.LOGIN
  const res = await liuReq.request(url, { operateType: "test", encryptedText })
  console.log("看一下 res: ")
  console.log(res)
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
      lpData.ghOAuthClientId = data.ghOAuthClientId
    }

    a(true)
  }
  initPromise = new Promise(_request)
}