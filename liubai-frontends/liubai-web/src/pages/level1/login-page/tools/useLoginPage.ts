import { reactive } from "vue";
import type { LpData, LoginByThirdParty } from "./types";
import { useMyProfile } from "~/hooks/useCommon";
import type { BoolFunc } from "~/utils/basic/type-tool";
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { Res_UserLoginInit } from "~/requests/data-types"

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
    console.log("1111111111")
    const res1 = await initPromise
    console.log("2222222222")
  }


  return {
    lpData,
    onEmailSubmitted,
    onSubmitCode,
    onBackFromCode,
    onTapLoginViaThirdParty,
  }
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