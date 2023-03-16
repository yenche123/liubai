
import { reactive } from "vue"
import type { SettingContentData } from "./types"
import localCache from "~/utils/system/local-cache"
import { i18n } from "~/locales"

const t = i18n.global.t

export function useSettingContent() {
  const data = reactive<SettingContentData>({
    language_txt: "",
    theme: "system",
    theme_txt: "",
  })

  initSettingContent(data)

  return {
    data
  }
}

function initSettingContent(
  data: SettingContentData
) {

  const localP = localCache.getLocalPreference()
  const theme = localP.theme
  if(!theme || theme === "system") {
    data.theme = "system"
    data.theme_txt = t('setting.follow_system')
  }
  else if(theme === "light") {
    data.theme = "light"
    data.theme_txt = t('setting.light')
  }
  else if(theme === "dark") {
    data.theme = "dark"
    data.theme_txt = t('setting.dark')
  }

  const lang = localP.language
  if(!lang || lang === "system") {
    data.language_txt = t('setting.follow_system')
  }
  else if(lang === "zh-Hans") {
    data.language_txt = "简体中文"
  }
  else if(lang === "zh-Hant") {
    data.language_txt = "繁體中文"
  }
  else {
    data.language_txt = "English"
  }

}