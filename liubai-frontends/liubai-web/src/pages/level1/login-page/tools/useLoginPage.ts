import { reactive } from "vue";
import type { LpData } from "./types";

export function useLoginPage() {

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

  const onBackFromCode = () => {
    lpData.view = "main"
  }

  return {
    lpData,
    onEmailSubmitted,
    onBackFromCode,
  }
}