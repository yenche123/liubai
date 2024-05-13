
import { reactive, watch } from "vue"
import type { SettingContentData } from "./types"
import cui from "~/components/custom-ui"
import { getLanguageList, getTermsList } from "./get-list"
import { handleLogoutWithBackend, handleLogoutWithPurlyLocal } from "./handle-logout"
import { whenTapTheme } from "./handle-theme"
import { whenTapLanguage } from "./handle-lang"
import liuEnv from "~/utils/liu-env"
import { useSystemStore } from "~/hooks/stores/useSystemStore"
import { storeToRefs } from "pinia"
import { useMyProfile, usePrefix } from "~/hooks/useCommon"

export function useSettingContent() {

  const { myProfile } = useMyProfile()
  const { prefix } = usePrefix()
  const hasBackend = liuEnv.hasBackend()

  const data = reactive<SettingContentData>({
    language: "system",
    language_txt: "",
    theme: "system",
    openTerms: false,
    termsList: getTermsList(),
    hasBackend,
  })

  listenSystemStore(data)

  const onTapTheme = () => whenTapTheme(data)
  const onTapLanguage = () => whenTapLanguage(data)
  const onTapTerms = () => data.openTerms = !data.openTerms
  const onTapLogout = () => whenTapLogout(data)
  const onTapAccounts = () => {
    cui.showModal({ 
      iconName: "emojis-construction_color", 
      content_key: "common.under_construction",
      showCancel: false,
    })
  }

  const version = LIU_ENV.version
  let appName = liuEnv.getEnv().APP_NAME ?? ""
  if(appName && appName[0]) {
    appName = appName[0].toUpperCase() + appName.substring(1)
  }

  return {
    myProfile,
    prefix,
    data,
    onTapTheme,
    onTapLanguage,
    onTapTerms,
    onTapLogout,
    onTapAccounts,
    version,
    appName,
  }
}

function listenSystemStore(
  data: SettingContentData
) {
  const systemStore = useSystemStore()
  const { local_theme, local_lang } = storeToRefs(systemStore)

  watch([local_theme, local_lang], (newV) => {
    const [theme, lang] = newV

    if(data.theme !== theme) {
      data.theme = theme
    }

    if(!data.language_txt || data.language !== lang) {
      data.language = lang
      const langList = getLanguageList()
      const langItem = langList.find(v => v.id === lang)
      if(langItem) data.language_txt = langItem.text
    }

  }, { immediate: true })
}

function whenTapLogout(
  data: SettingContentData
) {
  const res0 = liuEnv.getIfPurelyLocal()
  if(res0) askLogoutWithPurelyLocal()
  else askLogoutWithBackend()
}

async function askLogoutWithPurelyLocal() {
  const res = await cui.showModal({
    title_key: "setting.logout",
    content_key: "setting.logout_bd_2",
  })
  if(!res.confirm) return
  const res2 = await cui.showModal({
    title_key: "setting.logout_hd_2",
    content_key: "setting.logout_bd_3",
    modalType: "warning",
  })
  if(!res2.confirm) return
  handleLogoutWithPurlyLocal()
}

async function askLogoutWithBackend() {
  const res = await cui.showModal({
    title_key: "setting.logout",
    content_key: "setting.logout_bd",
    tip_key: "setting.logout_tip",
  })

  if(!res.confirm) return
  handleLogoutWithBackend(res.tipToggle ?? false)
}