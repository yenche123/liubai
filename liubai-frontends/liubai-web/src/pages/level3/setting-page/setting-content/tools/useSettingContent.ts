
import { reactive } from "vue"
import type { 
  SettingContentData, 
  LanguageItem, 
  ThemeItem 
} from "./types"
import type { SupportedTheme } from "~/types"
import localCache from "~/utils/system/local-cache"
import { i18n } from "~/locales"
import cui from "~/components/custom-ui"
import liuApi from "~/utils/liu-api"
import { useDynamics } from "~/hooks/useDynamics"

const t = i18n.global.t

export function useSettingContent() {
  const data = reactive<SettingContentData>({
    language_txt: "",
    theme: "system",
    theme_txt: "",
  })

  initSettingContent(data)

  const onTapTheme = () => whenTapTheme(data)
  const onTapLanguage = () => whenTapLanguage(data)

  return {
    data,
    onTapTheme,
    onTapLanguage
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

async function whenTapTheme(
  data: SettingContentData
) {
  const list = _getThemeList()
  const itemList = list.map(v => {
    return {
      text: v.text,
      iconName: v.iconName,
    }
  })

  const res = await cui.showActionSheet({ itemList })
  if(res.result !== "option" || res.tapIndex === undefined) return
  const item = list[res.tapIndex]
  if(item.id === data.theme) return


  const id = item.id

  localCache.setLocalPreference("theme", id)
  let newTheme: SupportedTheme
  let new_theme_txt: string = ""

  if(id === "light") {
    newTheme = id
    new_theme_txt = t('setting.light')
  }
  else if(id === "dark") {
    newTheme = id
    new_theme_txt = t('setting.dark')
  }
  else {
    newTheme = liuApi.getThemeFromSystem()
    new_theme_txt = t('setting.follow_system')
  }
  const { setTheme } = useDynamics()
  setTheme(newTheme)

  data.theme = id
  data.theme_txt = new_theme_txt
}

async function whenTapLanguage(
  data: SettingContentData
) {
  const list = _getLanguageList()
  const itemList = list.map(v => ({ text: v.text }))

  const res = await cui.showActionSheet({ itemList })


}

function _getThemeList() {
  const list: ThemeItem[] = [
    {
      id: "system",
      text: t('setting.follow_system'),
      iconName: "theme-system-theme",
    },
    {
      id: "light",
      text: t('setting.light'),
      iconName: "theme-light_mode",
    },
    {
      id: "dark",
      text: t('setting.dark'),
      iconName: "theme-dark_mode",
    }
  ]
  return list
}

function _getLanguageList() {
  const list: LanguageItem[] = [
    {
      id: "system",
      text: t('setting.follow_system'),
    },
    {
      id: "zh-Hans",
      text: "简体中文",
    },
    {
      id: "zh-Hant",
      text: "繁體中文",
    },
    {
      id: "en",
      text: "English",
    }
  ]
  return list
}