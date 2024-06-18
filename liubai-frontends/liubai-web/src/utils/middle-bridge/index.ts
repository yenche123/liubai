// 中间桥，供业务层调用，该组件再向更底层的函数
// 比如 liu-util / liu-api，获取或调用资源
import liuApi from "../liu-api"
import { i18n } from "~/locales"
import type { SetAppTitleOpt } from "./tools/types"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { LocalToCloud } from "../cloud/LocalToCloud"
import time from "../basic/time"

function setAppTitle(opt: SetAppTitleOpt = {}) {
  let title = ""
  let { val, val_key, val_opt } = opt

  const t = i18n.global.t
  if(val) {
    title = val
  }
  else if(val_key) {
    if(val_opt) title = t(val_key, val_opt)
    else title = t(val_key)
  }
  else {
    title = t("hello.appName")
  }

  liuApi.doc.setTitle(title)
}


async function modifyMemberNickname(val: string) {
  const wStore = useWorkspaceStore()
  await wStore.setNickName(val)

  const target_id = wStore.memberId
  if(!target_id) return

  LocalToCloud.addTask({
    uploadTask: "member-nickname",
    target_id,
    operateStamp: time.getTime(),
  }, { speed: "instant" })
}


export default {
  setAppTitle,
  modifyMemberNickname,
}