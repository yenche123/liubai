import { reactive } from "vue";
import type { LpData } from "./types";
import { useMyProfile } from "~/hooks/useCommon";

export function useLoginPage() {
  const { myProfile } = useMyProfile()

  const lpData = reactive<LpData>({
    view: "main",
    email: "",
    accounts: [],
  })

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

  return {
    lpData,
    onEmailSubmitted,
    onSubmitCode,
    onBackFromCode,
  }
}