import cui from "~/components/custom-ui";
import { db } from "~/utils/db";
import liuConsole from "~/utils/debug/liu-console";
import liuApi from "~/utils/liu-api";
import liuEnv from "~/utils/liu-env";
import { canReload, toReload } from "./handle-err";

function _redirectToCustomerService() {
  const _env = liuEnv.getEnv()
  let link = _env.CUSTOMER_SERVICE

  console.log("link 111 ", link)

  if(link) {
    window.open(link, "_blank")
    return
  }
  
  const email = LIU_ENV.author?.email
  if(!email) return
  link = `mailto:${email}`
  console.log("link 222 ", link)
  location.href = link
}

export function initListenDexie() {

  const _blocked = async () => {
    console.warn("db blocked!!!")

    const isStandalone = liuApi.canIUse.isRunningStandalone()
    let content_key = "err.database_blocked_1"
    if(isStandalone) content_key = "err.database_blocked_2"

    db.close()

    const res1 = await cui.showModal({
      title: "⚠️",
      content_key,
      showCancel: false,
      confirm_key: "common.contact_us",
      isTitleEqualToEmoji: true,
    })
    if(res1.confirm) {
      _redirectToCustomerService()
    }
  }

  db.on("blocked", _blocked)

  db.on("versionchange", (e) => {
    console.warn("db versionchange! x8")
    console.log(e)
    console.log(" ")
    liuConsole.sendMessage("db versionchange!")
    db.close()

    if(canReload("DexieVersionChange")) {
      toReload("DexieVersionChange")
    }
  })

  db.on("close", () => {
    console.warn("db close! x8")
  })

}