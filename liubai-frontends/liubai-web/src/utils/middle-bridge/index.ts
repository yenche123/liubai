// 中间桥，供业务层调用，该组件再向更底层的函数
// 比如 liu-util / liu-api，获取或调用资源
import liuApi from "../liu-api"
import { i18n } from "~/locales"

function setAppTitle(val?: string) {
  if(!val) {
    const t = i18n.global.t
    val = t("hello.appName")
  }

  liuApi.doc.setTitle(val)
}

export default {
  setAppTitle,
}