import cui from "~/components/custom-ui";
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

export function showEmailTip(
  content_key: string,
  title: string,
) {
  cui.showModal({
    title,
    content_key,
    showCancel: false,
    isTitleEqualToEmoji: true,
  })
}