import cui from "~/components/custom-ui";
import { type LiuErrReturn } from "~/requests/tools/types";
import liuApi from "~/utils/liu-api";

export function isEverythingOkay(
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

export function showDisableTip(thirdParty: string) {
  cui.showModal({
    title_key: "tip.tip",
    content_key: "login.cannot_login_via",
    content_opt: { thirdParty },
    showCancel: false,
  })
}

export async function showOtherTip(
  content_key: string,
  reload: boolean = false
) {
  await cui.showModal({
    title_key: "login.err_login",
    content_key,
    showCancel: false,
  })
  if(reload) {
    liuApi.route.reload()
  }
}

export async function showEmojiTip(
  content_key: string,
  title: string,
) {
  await cui.showModal({
    title,
    content_key,
    showCancel: false,
    isTitleEqualToEmoji: true,
  })
  return true
}

export async function showErrMsg(
  theType: "order" | "login",
  res: LiuErrReturn,
) {
  const code = res.code
  const errMsg = res.errMsg
  const showMsg = res.showMsg

  let content_key = "tip.try_again_later"
  let content_opt: Record<string, string> | undefined
  if(showMsg) {
    content_key = "tip.err_2"
    content_opt = { errMsg: showMsg, code }
  }
  else if(errMsg) {
    content_key = "tip.err_2"
    content_opt = { errMsg, code }
  }
  else {
    console.warn("没有 errMsg 和 showMsg 的错误")
    console.log(code)
    console.log(" ")
    return false
  }

  let title_key = theType === "order" ? "payment.err_1" : "login.err_login"
  await cui.showModal({
    title_key,
    content_key,
    content_opt,
    showCancel: false,
  })
  return true
}